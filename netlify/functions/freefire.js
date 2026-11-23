// =====================================================
// BIG STORE - FREE FIRE BACKEND
// Secure Wallet + ALU API + Order Management
// =====================================================

const crypto = require("crypto");

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALU_API_KEY = process.env.ALU_API_KEY;
const ALU_SECRET_KEY = process.env.ALU_SECRET_KEY;

const ALU_BASE_URL = "https://aluu.in";

// =====================================================
// CORS
// =====================================================

function corsHeaders(origin) {
    return {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };
}

// =====================================================
// JSON RESPONSE
// =====================================================

function response(statusCode, data, origin) {
    return {
        statusCode,
        headers: corsHeaders(origin),
        body: JSON.stringify(data)
    };
}

// =====================================================
// SUPABASE REQUEST
// =====================================================

async function supabaseRequest(path, options = {}) {

    const url = `${SUPABASE_URL}/rest/v1/${path}`;

    const result = await fetch(url, {
        ...options,
        headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const text = await result.text();

    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!result.ok) {
        throw new Error(
            data?.message ||
            data?.hint ||
            data?.details ||
            `Supabase error: ${result.status}`
        );
    }

    return data;
}

// =====================================================
// VERIFY CUSTOMER LOGIN
// =====================================================

async function verifyUser(event) {

    const authorization =
        event.headers.authorization ||
        event.headers.Authorization;

    if (!authorization ||
        !authorization.startsWith("Bearer ")) {
        throw new Error("Please login first.");
    }

    const accessToken = authorization.substring(7);

    const result = await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
            method: "GET",
            headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!result.ok) {
        throw new Error("Invalid login session.");
    }

    const user = await result.json();

    if (!user?.id) {
        throw new Error("Unable to verify customer.");
    }

    return user;
}

// =====================================================
// ALU SIGNATURE
// =====================================================

function createALUSignature(
    timestamp,
    method,
    path,
    rawBody = ""
) {

    const message =
        `${timestamp}.${method}.${path}.${rawBody}`;

    return crypto
        .createHmac("sha256", ALU_SECRET_KEY)
        .update(message)
        .digest("hex");
}

// =====================================================
// ALU API REQUEST
// =====================================================

async function aluRequest(
    method,
    path,
    body = null
) {

    if (!ALU_API_KEY || !ALU_SECRET_KEY) {
        throw new Error("ALU API configuration missing.");
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const rawBody = body ? JSON.stringify(body) : "";

    const signature = createALUSignature(
        timestamp,
        method,
        path,
        rawBody
    );

    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        15000
    );

    try {

        const result = await fetch(
            `${ALU_BASE_URL}${path}`,
            {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": ALU_API_KEY,
                    "X-Timestamp": String(timestamp),
                    "X-Signature": signature
                },
                body: body ? rawBody : undefined,
                signal: controller.signal
            }
        );

        const text = await result.text();

        let data;

        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { raw: text };
        }

        if (!result.ok) {
            const error = new Error(
                `ALU HTTP ${result.status}`
            );

            error.statusCode = result.status;
            error.aluResponse = data;

            throw error;
        }

        return data;

    } finally {
        clearTimeout(timeout);
    }
}

// =====================================================
// FREE FIRE PLAYER NAME CHECK
// =====================================================

async function checkPlayer(playerId) {

    if (!/^[0-9]{5,20}$/.test(playerId)) {
        throw new Error("Invalid Free Fire Player ID.");
    }

    const path =
        `/api/check/game-check?code=freefire_sgmy&characterId=${encodeURIComponent(playerId)}`;

    const result = await aluRequest("GET", path);

    if (result?.valid !== "valid") {
        throw new Error("Invalid Free Fire Player ID.");
    }

    if (!result.username) {
        throw new Error("Player name not received from ALU.");
    }

    return {
        playerId,
        playerName: result.username,
        region: result.region || "SG"
    };
}

// =====================================================
// CREATE SECURE WALLET ORDER
// =====================================================

async function createWalletOrder(
    userId,
    productId,
    player,
    clientRequestId
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
                p_region: "SG",
                p_client_request_id: clientRequestId
            })
        }
    );

    if (!result?.success || !result.order_id) {
        throw new Error(
            result?.message || "Unable to create wallet order."
        );
    }

    return result;
}

// =====================================================
// UPDATE ORDER
// =====================================================

async function updateOrder(orderId, values) {

    return await supabaseRequest(
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

// =====================================================
// CHECK ORDER OWNERSHIP
// =====================================================

async function getCustomerOrder(orderId, userId) {

    const rows = await supabaseRequest(
        `orders?id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(userId)}&select=id,order_number,user_id,player_id,product_name,amount,status,partner_orderid,alu_order_status,alu_response,refund_status,created_at`
    );

    if (!rows || !rows.length) {
        throw new Error("Order not found.");
    }

    return rows[0];
}

// =====================================================
// SUBMIT ALU TOP-UP
// =====================================================

async function submitALUOrder(order) {

    const body = {
        game: "freefire_sgmy",
        denom: order.alu_denom,
        userid: order.player_id,
        partner_orderid: order.partner_orderid,
        charname: order.player_name
    };

    return await aluRequest(
        "POST",
        "/api/v.1/create",
        body
    );
}

// =====================================================
// NAME CHECK ACTION
// =====================================================

async function nameCheck(body) {

    const playerId = String(body.player_id || "").trim();

    const player = await checkPlayer(playerId);

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

// =====================================================
// PURCHASE ACTION
// =====================================================

async function purchase(user, body) {

    const productId = body.product_id;

    const playerId = String(body.player_id || "").trim();

    const clientRequestId =
        String(body.client_request_id || "").trim();

    if (!productId || !clientRequestId) {
        throw new Error("Missing purchase information.");
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientRequestId)) {
        throw new Error("Invalid purchase request ID.");
    }

    // Always verify player again on the server
    const player = await checkPlayer(playerId);

    // Create order and debit wallet atomically in Supabase
    const walletOrder = await createWalletOrder(
        user.id,
        productId,
        player,
        clientRequestId
    );

    // Never submit ALU again for a duplicate request.
    // It may already have been submitted by an earlier request.
    if (walletOrder.duplicate) {

        return {
            success: true,
            duplicate: true,
            message: "This purchase request already exists.",
            order: walletOrder
        };
    }

    // Read the actual saved order details
    const order = await getCustomerOrder(
        walletOrder.order_id,
        user.id
    );

    // Submit to ALU
    try {

        const aluResult = await submitALUOrder({
            ...order,
            alu_denom: await getOrderDenom(order.id)
        });

        await updateOrder(order.id, {
            alu_response: aluResult,
            alu_order_status: "submitted"
        });

        return {
            success: true,
            message: "Order submitted. Waiting for ALU confirmation.",
            order: {
                id: order.id,
                order_number: order.order_number,
                status: "pending"
            },
            alu: aluResult
        };

    } catch (error) {

        // A timeout or HTTP error does not prove the ALU order failed.
        // Keep the wallet debit and order pending until status is checked.
        try {
            await updateOrder(order.id, {
                alu_order_status: "submission_uncertain",
                alu_response: {
                    message: error.message,
                    response: error.aluResponse || null
                }
            });
        } catch (saveError) {
            console.error("Unable to save ALU error:", saveError);
        }

        return {
            success: true,
            message: "Order created. ALU submission needs status verification.",
            order: {
                id: order.id,
                order_number: order.order_number,
                status: "pending"
            },
            pending_verification: true
        };
    }
}

// =====================================================
// GET ORDER DENOM
// =====================================================

async function getOrderDenom(orderId) {

    const rows = await supabaseRequest(
        `orders?id=eq.${encodeURIComponent(orderId)}&select=alu_denom`
    );

    if (!rows || !rows.length || !rows[0].alu_denom) {
        throw new Error("Order denomination not found.");
    }

    return rows[0].alu_denom;
}

// =====================================================
// ORDER STATUS ACTION
// =====================================================

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
        throw new Error("ALU Order ID not found.");
    }

    const aluResult = await aluRequest(
        "GET",
        `/api/v.1/${encodeURIComponent(order.partner_orderid)}`
    );

    // Return raw status for now.
    // Do not mark success/failure or refund without verified ALU status mapping.
    return {
        success: true,
        message: "ALU status received.",
        order: {
            id: order.id,
            order_number: order.order_number,
            current_status: order.status
        },
        alu: aluResult
    };
}

// =====================================================
// MAIN HANDLER
// =====================================================

exports.handler = async (event) => {

    const origin =
        event.headers.origin ||
        event.headers.Origin ||
        "*";

    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 204,
            headers: corsHeaders(origin),
            body: ""
        };
    }

    if (event.httpMethod !== "POST") {
        return response(
            405,
            {
                success: false,
                message: "Method not allowed."
            },
            origin
        );
    }

    try {

        // Check required configuration
        if (
            !SUPABASE_URL ||
            !SUPABASE_SERVICE_ROLE_KEY ||
            !ALU_API_KEY ||
            !ALU_SECRET_KEY
        ) {
            throw new Error("Backend environment configuration missing.");
        }

        // Verify customer
        const user = await verifyUser(event);

        // Parse request
        let body;

        try {
            body = JSON.parse(event.body || "{}");
        } catch {
            return response(
                400,
                {
                    success: false,
                    message: "Invalid JSON request."
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
                return response(
                    410,
                    {
                        success: false,
                        message: "Load active products directly from Supabase."
                    },
                    origin
                );

            default:
                return response(
                    400,
                    {
                        success: false,
                        message: "Invalid action."
                    },
                    origin
                );
        }

        return response(200, result, origin);

    } catch (error) {

        console.error("BIG STORE FREE FIRE ERROR:", error);

        return response(
            400,
            {
                success: false,
                message: error.message || "Something went wrong."
            },
            origin
        );
    }
};