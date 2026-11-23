// ======================================================
// BIG STORE - FREE FIRE BACKEND
// Supabase + ALU API + Secure Wallet
// ======================================================

const crypto = require("crypto");

// ======================================================
// CONFIGURATION
// ======================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALU_API_KEY = process.env.ALU_API_KEY;
const ALU_SECRET_KEY = process.env.ALU_SECRET_KEY;

const ALU_BASE_URL = "https://aluu.in";

// ======================================================
// RESPONSE
// ======================================================

function sendResponse(statusCode, data, origin = "*") {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers":
                "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "POST, OPTIONS"
        },
        body: JSON.stringify(data)
    };
}

// ======================================================
// SUPABASE REST REQUEST
// ======================================================

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
            `Supabase request failed (${response.status})`
        );
    }

    return data;
}

// ======================================================
// VERIFY CUSTOMER
// ======================================================

async function verifyUser(event) {
    const authorization =
        event.headers.authorization ||
        event.headers.Authorization;

    if (!authorization?.startsWith("Bearer ")) {
        throw new Error("Please login first.");
    }

    const accessToken = authorization.substring(7);

    const response = await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
            headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {
        throw new Error("Login session expired. Please login again.");
    }

    const user = await response.json();

    if (!user?.id) {
        throw new Error("Unable to verify customer.");
    }

    return user;
}

// ======================================================
// ALU HMAC SIGNATURE
// ======================================================

function createALUSignature(
    timestamp,
    method,
    pathWithQuery,
    rawBody = ""
) {
    const message =
        `${timestamp}.${method}.${pathWithQuery}.${rawBody}`;

    return crypto
        .createHmac("sha256", ALU_SECRET_KEY)
        .update(message)
        .digest("hex");
}

// ======================================================
// ALU REQUEST
// ======================================================

async function aluRequest(method, path, body = null) {
    if (!ALU_API_KEY || !ALU_SECRET_KEY) {
        throw new Error("ALU API configuration is missing.");
    }

    const timestamp = Math.floor(Date.now() / 1000);

    // Use exactly the same raw body for signing and sending.
    const rawBody = body === null ? "" : JSON.stringify(body);

    const signature = createALUSignature(
        timestamp,
        method,
        path,
        rawBody
    );

    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        20000
    );

    try {
        const response = await fetch(
            `${ALU_BASE_URL}${path}`,
            {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": ALU_API_KEY,
                    "X-Timestamp": String(timestamp),
                    "X-Signature": signature
                },
                body: body === null ? undefined : rawBody,
                signal: controller.signal
            }
        );

        const text = await response.text();

        let data;

        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { raw: text };
        }

        if (!response.ok) {
            const error = new Error(
                `ALU API returned HTTP ${response.status}`
            );

            error.aluStatus = response.status;
            error.aluData = data;

            throw error;
        }

        return data;

    } finally {
        clearTimeout(timeout);
    }
}

// ======================================================
// EXTRACT ALU PLAYER DETAILS
// ======================================================

function findPlayerData(value, depth = 0) {
    if (!value || typeof value !== "object" || depth > 5) {
        return null;
    }

    if (
        typeof value.valid === "string" ||
        typeof value.username === "string"
    ) {
        return value;
    }

    for (const child of Object.values(value)) {
        if (child && typeof child === "object") {
            const result = findPlayerData(child, depth + 1);

            if (result) {
                return result;
            }
        }
    }

    return null;
}

// ======================================================
// FREE FIRE NAME CHECK
// ======================================================

async function checkPlayer(playerId) {
    const uid = String(playerId || "").trim();

    if (!/^[0-9]{5,20}$/.test(uid)) {
        throw new Error(
            "Player ID must contain 5 to 20 digits."
        );
    }

    const path =
        `/api/check/game-check?code=freefire_sgmy&characterId=${encodeURIComponent(uid)}`;

    let aluResult;

    try {
        aluResult = await aluRequest("GET", path);
    } catch (error) {
        console.error("ALU NAME CHECK ERROR:", {
            message: error.message,
            status: error.aluStatus,
            response: error.aluData
        });

        throw new Error(
            "ALU Name Check API error: " + error.message
        );
    }

    console.log(
        "ALU NAME CHECK RESPONSE:",
        JSON.stringify(aluResult)
    );

    const player = findPlayerData(aluResult);

    if (!player || player.valid !== "valid") {
        throw new Error(
            "Player verification failed. Please check the Player ID."
        );
    }

    if (!player.username) {
        throw new Error(
            "ALU did not return the Player Name."
        );
    }

    const region = String(
        player.region || "SG"
    ).toUpperCase();

    if (region !== "SG") {
        throw new Error("This Free Fire region is not supported.");
    }

    return {
        playerId: uid,
        playerName: player.username,
        region
    };
}

// ======================================================
// SECURE WALLET ORDER CREATION
// ======================================================

async function createWalletOrder(
    userId,
    productId,
    player,
    requestId
) {
    const result = await supabaseRequest(
        "rpc/create_freefire_order_secure",
        {
            method: "POST",
            body: JSON.stringify({
                p_user_id: userId,
                p_product_id: productId,
                p_player_id: player.playerId,
                p_player_name: player.playerName,
                p_region: player.region,
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

// ======================================================
// GET CUSTOMER ORDER
// ======================================================

async function getCustomerOrder(orderId, userId) {
    const rows = await supabaseRequest(
        "orders" +
        `?id=eq.${encodeURIComponent(orderId)}` +
        `&user_id=eq.${encodeURIComponent(userId)}` +
        "&select=id,order_number,user_id,player_id,player_name," +
        "product_name,amount,status,partner_orderid," +
        "alu_game_code,alu_denom,alu_order_status," +
        "refund_status,created_at"
    );

    if (!rows?.length) {
        throw new Error("Order not found.");
    }

    return rows[0];
}

// ======================================================
// UPDATE ORDER
// ======================================================

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

// ======================================================
// ALU CREATE ORDER
// ======================================================

async function createALUOrder(order) {
    const body = {
        game: order.alu_game_code,
        denom: order.alu_denom,
        userid: order.player_id,
        partner_orderid: order.partner_orderid,
        charname: order.player_name
    };

    return aluRequest(
        "POST",
        "/api/v.1/create",
        body
    );
}

// ======================================================
// NAME CHECK ACTION
// ======================================================

async function nameCheck(body) {
    const player = await checkPlayer(body.player_id);

    return {
        success: true,
        data: {
            valid: "valid",
            username: player.playerName,
            region: player.region,
            player_id: player.playerId
        }
    };
}

// ======================================================
// PURCHASE ACTION
// ======================================================

async function purchase(user, body) {
    const productId = String(body.product_id || "").trim();

    const requestId = String(
        body.client_request_id || ""
    ).trim();

    if (!productId || !requestId) {
        throw new Error("Product or request ID is missing.");
    }

    if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)
    ) {
        throw new Error("Invalid request ID.");
    }

    // Always verify player on the server.
    const player = await checkPlayer(body.player_id);

    // Atomically debit wallet and create order.
    const walletOrder = await createWalletOrder(
        user.id,
        productId,
        player,
        requestId
    );

    // Never submit a duplicate request again.
    if (walletOrder.duplicate) {
        return {
            success: true,
            duplicate: true,
            message: "This purchase request already exists.",
            order: walletOrder
        };
    }

    const order = await getCustomerOrder(
        walletOrder.order_id,
        user.id
    );

    // Ensure order has required ALU details.
    if (
        !order.alu_game_code ||
        !order.alu_denom ||
        !order.partner_orderid
    ) {
        throw new Error(
            "Order is missing required ALU information."
        );
    }

    try {
        const aluResult = await createALUOrder(order);

        await updateOrder(order.id, {
            alu_response: aluResult,
            alu_order_status: "submitted"
        });

        return {
            success: true,
            message: "Order submitted. Waiting for confirmation.",
            order: {
                id: order.id,
                order_number: order.order_number,
                status: "pending"
            },
            alu: aluResult
        };

    } catch (error) {
        console.error("ALU CREATE ORDER ERROR:", {
            message: error.message,
            status: error.aluStatus,
            response: error.aluData
        });

        // Do not refund an uncertain order automatically.
        await updateOrder(order.id, {
            alu_order_status: "submission_uncertain",
            alu_response: {
                message: error.message,
                response: error.aluData || null
            }
        });

        return {
            success: true,
            pending_verification: true,
            message:
                "Order created. ALU status must be verified.",
            order: {
                id: order.id,
                order_number: order.order_number,
                status: "pending"
            }
        };
    }
}

// ======================================================
// ORDER STATUS ACTION
// ======================================================

async function orderStatus(user, body) {
    const orderId = String(body.order_id || "").trim();

    if (!orderId) {
        throw new Error("Order ID is required.");
    }

    const order = await getCustomerOrder(
        orderId,
        user.id
    );

    if (!order.partner_orderid) {
        throw new Error("ALU Partner Order ID is missing.");
    }

    const aluResult = await aluRequest(
        "GET",
        `/api/v.1/${encodeURIComponent(order.partner_orderid)}`
    );

    // Keep raw ALU status until its exact status values are confirmed.
    return {
        success: true,
        message: "ALU status received.",
        order: {
            id: order.id,
            order_number: order.order_number,
            status: order.status
        },
        alu: aluResult
    };
}

// ======================================================
// MAIN HANDLER
// ======================================================

exports.handler = async (event) => {
    const origin =
        event.headers.origin ||
        event.headers.Origin ||
        "*";

    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 204,
            headers: {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Headers":
                    "Content-Type, Authorization",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: ""
        };
    }

    if (event.httpMethod !== "POST") {
        return sendResponse(
            405,
            {
                success: false,
                message: "Method not allowed."
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

        let body;

        try {
            body = JSON.parse(event.body || "{}");
        } catch {
            return sendResponse(
                400,
                {
                    success: false,
                    message: "Invalid JSON."
                },
                origin
            );
        }

        let result;

        switch (body.action) {
            case "name-check":
                result = await nameCheck(body);
                break;

            case "purchase":
                result = await purchase(user, body);
                break;

            case "order-status":
                result = await orderStatus(user, body);
                break;

            case "products":
                return sendResponse(
                    410,
                    {
                        success: false,
                        message:
                            "Load products from Supabase."
                    },
                    origin
                );

            default:
                return sendResponse(
                    400,
                    {
                        success: false,
                        message: "Invalid action."
                    },
                    origin
                );
        }

        return sendResponse(200, result, origin);

    } catch (error) {
        console.error(
            "BIG STORE FREE FIRE BACKEND ERROR:",
            error
        );

        return sendResponse(
            400,
            {
                success: false,
                message: error.message || "Backend error."
            },
            origin
        );
    }
};