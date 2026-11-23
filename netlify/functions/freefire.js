const crypto = require("crypto");

// ==================================================
// BIG STORE - FREE FIRE BACKEND
// ALU NAME CHECK + AUTOMATIC TOP-UP
// ==================================================

const API_BASE = "https://aluu.in";

// Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

// ALU
const ALU_API_KEY = process.env.ALU_API_KEY;
const ALU_SECRET_KEY = process.env.ALU_SECRET_KEY;


// ==================================================
// JSON RESPONSE
// ==================================================

function json(statusCode, data, origin = "*") {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers":
                "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "POST, OPTIONS"
        },
        body: JSON.stringify(data)
    };
}


// ==================================================
// VERIFY CUSTOMER
// ==================================================

async function verifyUser(event) {

    const headers = event.headers || {};

    const authorization =
        headers.authorization ||
        headers.Authorization;

    if (!authorization?.startsWith("Bearer ")) {
        throw new Error("Please login first.");
    }

    const token = authorization.substring(7);

    const response = await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
            headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        throw new Error("Invalid login session.");
    }

    const user = await response.json();

    if (!user?.id) {
        throw new Error("Customer verification failed.");
    }

    return user;
}


// ==================================================
// ALU SIGNED REQUEST
// SAME METHOD AS PHOENIX STORE
// ==================================================

async function aluuRequest(method, pathWithQuery, body = null) {

    if (!ALU_API_KEY || !ALU_SECRET_KEY) {
        throw new Error("ALU API credentials are missing.");
    }

    const timestamp = String(
        Math.floor(Date.now() / 1000)
    );

    const rawBody = body
        ? JSON.stringify(body)
        : "";

    const message =
        `${timestamp}.${method}.${pathWithQuery}.${rawBody}`;

    const signature = crypto
        .createHmac("sha256", ALU_SECRET_KEY)
        .update(message, "utf8")
        .digest("hex");

    const headers = {
        "x-api-key": ALU_API_KEY,
        "X-Timestamp": timestamp,
        "X-Signature": signature
    };

    if (body) {
        headers["Content-Type"] = "application/json";
    }

    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        20000
    );

    try {

        const response = await fetch(
            `${API_BASE}${pathWithQuery}`,
            {
                method,
                headers,
                body: body ? rawBody : undefined,
                signal: controller.signal
            }
        );

        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        } catch {
            data = {
                message: responseText || "Empty API response."
            };
        }

        return {
            httpStatus: response.status,
            data
        };

    } finally {
        clearTimeout(timeout);
    }
}


// ==================================================
// SUPABASE REQUEST
// BACKEND SERVICE ROLE
// ==================================================

async function supabaseRequest(path, options = {}) {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${path}`,
        {
            ...options,
            headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization:
                    `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    const text = await response.text();

    let data;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        console.error("SUPABASE ERROR:", data);

        throw new Error(
            data?.message ||
            data?.details ||
            data?.hint ||
            `Supabase error: ${response.status}`
        );
    }

    return data;
}


// ==================================================
// PLAYER NAME CHECK
// ==================================================

async function nameCheck(input) {

    const uid = String(
        input.uid || input.player_id || ""
    ).trim();

    if (!/^\d{5,20}$/.test(uid)) {
        throw new Error("Invalid Free Fire UID.");
    }

    const params = new URLSearchParams({
        code: "freefire_sgmy",
        characterId: uid
    });

    const pathWithQuery =
        `/api/check/game-check?${params.toString()}`;

    const result = await aluuRequest(
        "GET",
        pathWithQuery
    );

    console.log(
        "BIG STORE ALU NAME CHECK:",
        JSON.stringify(result)
    );

    const data = result.data || {};

    if (
        result.httpStatus < 200 ||
        result.httpStatus >= 300 ||
        data.success === false ||
        data.valid !== "valid"
    ) {
        return {
            success: false,
            httpStatus: result.httpStatus,
            message:
                data.message || "Player verification failed.",
            alu: data
        };
    }

    // ALU Generic Game Check returns name/nickname/fullname.
    const playerName =
        data.name ||
        data.nickname ||
        data.fullname ||
        data.username ||
        "";

    if (!playerName) {
        return {
            success: false,
            httpStatus: result.httpStatus,
            message: "Player name was not returned by ALU.",
            alu: data
        };
    }

    return {
        success: true,
        httpStatus: result.httpStatus,
        data: {
            valid: "valid",
            uid: data.uid || uid,
            player_id: uid,
            username: playerName,
            name: playerName,
            nickname: data.nickname || playerName,
            region: data.region || "SG"
        },
        alu: data
    };
}


// ==================================================
// SECURE WALLET ORDER CREATION
// ==================================================

async function createWalletOrder(
    userId,
    productId,
    playerId,
    playerName,
    requestId
) {

    // This RPC must be restricted to service_role.
    // Do not call the old customer-accessible RPC.

    const result = await supabaseRequest(
        "rpc/create_freefire_order_secure",
        {
            method: "POST",
            body: JSON.stringify({
                p_user_id: userId,
                p_product_id: productId,
                p_player_id: playerId,
                p_player_name: playerName,
                p_region: "SG",
                p_client_request_id: requestId
            })
        }
    );

    if (!result?.success || !result.order_id) {
        throw new Error(
            result?.message || "Wallet order creation failed."
        );
    }

    return result;
}


// ==================================================
// GET CUSTOMER ORDER
// ==================================================

async function getOrder(orderId, userId) {

    const rows = await supabaseRequest(
        "orders" +
        `?id=eq.${encodeURIComponent(orderId)}` +
        `&user_id=eq.${encodeURIComponent(userId)}` +
        "&select=id,order_number,user_id,product_name," +
        "player_id,player_name,amount,status," +
        "partner_orderid,alu_game_code,alu_denom," +
        "alu_order_status,refund_status"
    );

    if (!rows?.length) {
        throw new Error("Order not found.");
    }

    return rows[0];
}


// ==================================================
// UPDATE ORDER
// ==================================================

async function updateOrder(orderId, values) {

    return supabaseRequest(
        `orders?id=eq.${encodeURIComponent(orderId)}`,
        {
            method: "PATCH",
            headers: {
                Prefer: "return=minimal"
            },
            body: JSON.stringify(values)
        }
    );
}


// ==================================================
// ALU CREATE ORDER
// SAME REQUEST FORMAT AS PHOENIX
// ==================================================

async function createALUOrder(order) {

    const orderBody = {
        game: order.alu_game_code,
        denom: order.alu_denom,
        userid: order.player_id,
        partner_orderid: order.partner_orderid,
        charname: order.player_name || ""
    };

    const webhookUrl = process.env.ALU_WEBHOOK_URL;

    if (webhookUrl) {

        const parsedUrl = new URL(webhookUrl);

        if (parsedUrl.protocol !== "https:") {
            throw new Error("Webhook URL must use HTTPS.");
        }

        orderBody.partner_webhook_url = webhookUrl;
    }

    return aluuRequest(
        "POST",
        "/api/v.1/create",
        orderBody
    );
}


// ==================================================
// PURCHASE
// ==================================================

async function purchase(user, input) {

    const productId = String(
        input.product_id || ""
    ).trim();

    const playerId = String(
        input.player_id || input.uid || ""
    ).trim();

    const requestId = String(
        input.client_request_id || ""
    ).trim();

    if (!productId || !playerId || !requestId) {
        throw new Error("Missing purchase information.");
    }

    if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)
    ) {
        throw new Error("Invalid purchase request ID.");
    }

    // 1. Verify player again on the backend.
    const verified = await nameCheck({
        player_id: playerId
    });

    if (!verified.success) {
        throw new Error(
            verified.message || "Player verification failed."
        );
    }

    const playerName = verified.data.username;

    // 2. Secure wallet debit + database order.
    const walletOrder = await createWalletOrder(
        user.id,
        productId,
        playerId,
        playerName,
        requestId
    );

    // 3. Do not submit duplicate requests.
    if (walletOrder.duplicate) {
        return {
            success: true,
            duplicate: true,
            message: "This purchase request already exists.",
            order: walletOrder
        };
    }

    // 4. Read the saved database order.
    const order = await getOrder(
        walletOrder.order_id,
        user.id
    );

    if (
        !order.alu_game_code ||
        !order.alu_denom ||
        !order.partner_orderid
    ) {
        throw new Error("ALU order information is incomplete.");
    }

    // 5. Submit to ALU.
    let result;

    try {

        result = await createALUOrder(order);

    } catch (error) {

        console.error("ALU CREATE REQUEST ERROR:", error);

        // The request may have reached ALU despite a timeout.
        // Never send a second create request automatically.

        await updateOrder(order.id, {
            alu_order_status: "submission_uncertain",
            alu_response: {
                message: error.message
            }
        });

        return {
            success: true,
            pending_verification: true,
            message:
                "Order saved. ALU submission needs status verification.",
            order: {
                id: order.id,
                order_number: order.order_number,
                status: "pending"
            }
        };
    }

    console.log(
        "BIG STORE ALU CREATE RESPONSE:",
        JSON.stringify(result)
    );

    const aluData = result.data?.data || result.data || {};

    // ALU can accept an order with pending status.
    if (
        result.httpStatus >= 200 &&
        result.httpStatus < 300 &&
        result.data?.success !== false
    ) {

        await updateOrder(order.id, {
            alu_response: result.data,
            alu_order_status: aluData.status || "pending"
        });

        return {
            success: true,
            message: "ALU accepted the order.",
            order: {
                id: order.id,
                order_number: order.order_number,
                status: "pending"
            },
            alu: result.data
        };
    }

    // Do not retry or refund automatically here.
    // A status check must first establish the final outcome.

    await updateOrder(order.id, {
        alu_response: result.data,
        alu_order_status: "submission_uncertain"
    });

    return {
        success: true,
        pending_verification: true,
        message: "ALU returned an error. Verify order status before retrying.",
        order: {
            id: order.id,
            order_number: order.order_number,
            status: "pending"
        },
        alu: result.data
    };
}


// ==================================================
// ORDER STATUS CHECK
// ==================================================

async function orderStatus(user, input) {

    const orderId = String(
        input.order_id || ""
    ).trim();

    if (!orderId) {
        throw new Error("Order ID is required.");
    }

    const order = await getOrder(
        orderId,
        user.id
    );

    if (!order.partner_orderid) {
        throw new Error("Partner Order ID not found.");
    }

    const path =
        `/api/v.1/${encodeURIComponent(order.partner_orderid)}`;

    const result = await aluuRequest(
        "GET",
        path
    );

    const aluData =
        result.data?.data || result.data || {};

    // Only ALU-confirmed success completes the order.
    if (
        result.httpStatus >= 200 &&
        result.httpStatus < 300 &&
        aluData.status === "successful"
    ) {

        await updateOrder(order.id, {
            status: "completed",
            alu_order_status: "successful",
            alu_response: result.data
        });
    } else {

        await updateOrder(order.id, {
            alu_order_status:
                aluData.status || "pending",
            alu_response: result.data
        });
    }

    return {
        success:
            result.httpStatus >= 200 &&
            result.httpStatus < 300,
        httpStatus: result.httpStatus,
        order: {
            id: order.id,
            order_number: order.order_number
        },
        alu: result.data
    };
}


// ==================================================
// MAIN HANDLER
// ==================================================

exports.handler = async (event) => {

    const origin =
        event.headers?.origin ||
        event.headers?.Origin ||
        "*";

    if (event.httpMethod === "OPTIONS") {
        return json(200, { success: true }, origin);
    }

    if (event.httpMethod !== "POST") {
        return json(
            405,
            {
                success: false,
                message: "POST method required."
            },
            origin
        );
    }

    try {

        if (
            !SUPABASE_URL ||
            !SUPABASE_SERVICE_ROLE_KEY ||
            !ALU_API_KEY ||
            !ALU_SECRET_KEY
        ) {
            throw new Error(
                "Backend environment variables are missing."
            );
        }

        const user = await verifyUser(event);

        let input;

        try {
            input = JSON.parse(event.body || "{}");
        } catch {
            return json(
                400,
                {
                    success: false,
                    message: "Invalid JSON request."
                },
                origin
            );
        }

        let result;

        switch (input.action) {

            case "name-check":
                result = await nameCheck(input);
                break;

            case "purchase":
                result = await purchase(user, input);
                break;

            case "order-status":
                result = await orderStatus(user, input);
                break;

            case "products":
                return json(
                    410,
                    {
                        success: false,
                        message:
                            "Load products directly from Supabase."
                    },
                    origin
                );

            default:
                return json(
                    400,
                    {
                        success: false,
                        message: "Unknown action."
                    },
                    origin
                );
        }

        return json(200, result, origin);

    } catch (error) {

        console.error(
            "BIG STORE FREE FIRE BACKEND ERROR:",
            error
        );

        return json(
            400,
            {
                success: false,
                message: error.message || "Backend error."
            },
            origin
        );
    }
};