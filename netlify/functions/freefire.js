const crypto = require("crypto");

// ==========================================
// BIG STORE - FREE FIRE BACKEND
// NAME CHECK + AUTOMATIC TOP-UP
// ==========================================

const API_BASE = "https://aluu.in";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;


// ==========================================
// JSON RESPONSE
// ==========================================

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


// ==========================================
// VERIFY CUSTOMER
// ==========================================

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
            method: "GET",
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


// ==========================================
// ALU SIGNED REQUEST
// SAME METHOD AS PHOENIX STORE
// ==========================================

async function aluuRequest(method, pathWithQuery, body = null) {

    const apiKey = process.env.ALU_API_KEY;
    const secret = process.env.ALU_SECRET_KEY;

    if (!apiKey || !secret) {
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
        .createHmac("sha256", secret)
        .update(message, "utf8")
        .digest("hex");

    const headers = {
        "x-api-key": apiKey,
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


// ==========================================
// SUPABASE REQUEST
// SERVICE ROLE ONLY - BACKEND
// ==========================================

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


// ==========================================
// FREE FIRE PLAYER NAME CHECK
// ==========================================

async function nameCheck(input) {

    // Support both frontend field names
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
        JSON.stringify(result.data)
    );

    const success =
        result.httpStatus >= 200 &&
        result.httpStatus < 300 &&
        result.data.success !== false;

    return {
        success,
        httpStatus: result.httpStatus,
        data: result.data,
        alu: result.data
    };
}


// ==========================================
// SECURE WALLET ORDER CREATION
// ==========================================

async function createWalletOrder(
    userId,
    productId,
    playerId,
    playerName,
    requestId
) {

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


// ==========================================
// GET CUSTOMER ORDER
// ==========================================

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

    if (!rows || !rows.length) {
        throw new Error("Order not found.");
    }

    return rows[0];
}


// ==========================================
// UPDATE ORDER
// ==========================================

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


// ==========================================
// ALU AUTOMATIC TOP-UP
// ==========================================

async function createALUTopUp(order) {

    const orderBody = {
        game: order.alu_game_code,
        denom: order.alu_denom,
        userid: order.player_id,
        partner_orderid: order.partner_orderid,
        charname: order.player_name
    };

    // Optional webhook
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


// ==========================================
// PURCHASE ACTION
// ==========================================

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

    // 1. Verify player directly with ALU
    const playerResult = await nameCheck({
        player_id: playerId
    });

    const playerData = playerResult.data;

    if (
        !playerResult.success ||
        playerData?.valid !== "valid" ||
        !playerData?.username
    ) {
        throw new Error(
            "Free Fire Player Verification Failed."
        );
    }

    const playerName = playerData.username;

    // 2. Create secure wallet order
    const walletOrder = await createWalletOrder(
        user.id,
        productId,
        playerId,
        playerName,
        requestId
    );

    // 3. Never submit a duplicate request again
    if (walletOrder.duplicate) {

        return {
            success: true,
            duplicate: true,
            message: "This order already exists.",
            order: walletOrder
        };
    }

    // 4. Get saved order
    const order = await getOrder(
        walletOrder.order_id,
        user.id
    );

    if (
        !order.alu_game_code ||
        !order.alu_denom ||
        !order.partner_orderid
    ) {
        throw new Error(
            "ALU order information is incomplete."
        );
    }

    // 5. Submit automatic top-up
    try {

        const result = await createALUTopUp(order);

        await updateOrder(order.id, {
            alu_response: result.data,
            alu_order_status: "submitted"
        });

        return {
            success: true,
            message: "Top-Up request submitted to ALU.",
            order: {
                id: order.id,
                order_number: order.order_number,
                status: "pending"
            },
            alu: result.data
        };

    } catch (error) {

        console.error(
            "BIG STORE ALU CREATE ERROR:",
            error
        );

        // Do not automatically refund an uncertain request.
        await updateOrder(order.id, {
            alu_order_status: "submission_uncertain",
            alu_response: {
                message: error.message,
                httpStatus: error.httpStatus || null,
                response: error.data || null
            }
        });

        return {
            success: true,
            pending_verification: true,
            message:
                "Order created. ALU submission needs verification.",
            order: {
                id: order.id,
                order_number: order.order_number,
                status: "pending"
            }
        };
    }
}


// ==========================================
// ORDER STATUS CHECK
// ==========================================

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

    await updateOrder(order.id, {
        alu_response: result.data,
        alu_order_status: "status_checked"
    });

    return {
        success:
            result.httpStatus >= 200 &&
            result.httpStatus < 300,
        httpStatus: result.httpStatus,
        order: {
            id: order.id,
            order_number: order.order_number,
            status: order.status
        },
        alu: result.data
    };
}


// ==========================================
// MAIN HANDLER
// ==========================================

exports.handler = async (event) => {

    const origin =
        event.headers?.origin ||
        event.headers?.Origin ||
        "*";

    // OPTIONS
    if (event.httpMethod === "OPTIONS") {
        return json(200, { success: true }, origin);
    }

    // POST ONLY
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

        // Check environment
        if (
            !SUPABASE_URL ||
            !SUPABASE_SERVICE_ROLE_KEY ||
            !process.env.ALU_API_KEY ||
            !process.env.ALU_SECRET_KEY
        ) {
            throw new Error(
                "Backend environment variables are missing."
            );
        }

        // Verify customer
        const user = await verifyUser(event);

        // Parse JSON
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
            "BIG STORE FREE FIRE ERROR:",
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