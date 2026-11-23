// ======================================================
// BIG STORE - FREE FIRE BACKEND
// SECURE NETLIFY SERVERLESS FUNCTION
// ======================================================

const crypto = require("crypto");

// ======================================================
// 01. ENVIRONMENT VARIABLES
// ======================================================

const SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALU_API_KEY = process.env.ALU_API_KEY;

const ALU_SECRET_KEY = process.env.ALU_SECRET_KEY;

const ALU_BASE_URL = "https://aluu.in";

// ======================================================
// 02. CORS HEADERS
// ======================================================

function getHeaders(origin) {

    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
        "Vary": "Origin"
    };

}

// ======================================================
// 03. JSON RESPONSE
// ======================================================

function response(statusCode, body, origin) {

    return {
        statusCode,
        headers: getHeaders(origin),
        body: JSON.stringify(body)
    };

}

// ======================================================
// 04. VERIFY USER LOGIN
// ======================================================

async function verifyUser(event) {

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("SUPABASE_CONFIGURATION_ERROR");
    }

    const authorization =
        event.headers?.authorization ||
        event.headers?.Authorization;

    if (
        !authorization ||
        !authorization.startsWith("Bearer ")
    ) {
        throw new Error("LOGIN_REQUIRED");
    }

    const accessToken =
        authorization.substring(7).trim();

    const result = await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
            method: "GET",
            headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": `Bearer ${accessToken}`
            }
        }
    );

    if (!result.ok) {
        throw new Error("INVALID_SESSION");
    }

    const user = await result.json();

    if (!user || !user.id) {
        throw new Error("INVALID_SESSION");
    }

    return user;

}

// ======================================================
// 05. CREATE ALU SIGNATURE
// ======================================================

function createALUSignature(
    timestamp,
    method,
    path,
    rawBody
) {

    const message =
        `${timestamp}.${method}.${path}.${rawBody}`;

    return crypto
        .createHmac("sha256", ALU_SECRET_KEY)
        .update(message)
        .digest("hex");

}

// ======================================================
// 06. ALU API REQUEST
// ======================================================

async function aluRequest(
    method,
    path,
    body = null
) {

    if (!ALU_API_KEY || !ALU_SECRET_KEY) {
        throw new Error("ALU_CONFIGURATION_ERROR");
    }

    const timestamp =
        Math.floor(Date.now() / 1000).toString();

    const rawBody =
        body === null ? "" : JSON.stringify(body);

    const signature = createALUSignature(
        timestamp,
        method,
        path,
        rawBody
    );

    const headers = {
        "x-api-key": ALU_API_KEY,
        "X-Timestamp": timestamp,
        "X-Signature": signature
    };

    if (body !== null) {
        headers["Content-Type"] = "application/json";
    }

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
                headers,
                signal: controller.signal,
                ...(body !== null ? { body: rawBody } : {})
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

            console.error(
                "ALU API ERROR:",
                result.status,
                data
            );

            throw new Error(
                data?.message ||
                data?.error ||
                `ALU_HTTP_${result.status}`
            );

        }

        return data;

    } finally {

        clearTimeout(timeout);

    }

}

// ======================================================
// 07. FREE FIRE PLAYER NAME CHECK
// ======================================================

async function checkPlayer(uid) {

    if (!/^\d{5,20}$/.test(uid)) {
        throw new Error("INVALID_PLAYER_ID");
    }

    const path =
        `/api/check/game-check?code=freefire_sgmy&characterId=${encodeURIComponent(uid)}`;

    const result = await aluRequest(
        "GET",
        path
    );

    console.log(
        "ALU NAME CHECK RESPONSE:",
        JSON.stringify(result)
    );

    return result;

}

// ======================================================
// 08. MAIN HANDLER
// ======================================================

exports.handler = async (event) => {

    const origin = event.headers?.origin || "*";

    // OPTIONS

    if (event.httpMethod === "OPTIONS") {

        return {
            statusCode: 204,
            headers: getHeaders(origin),
            body: ""
        };

    }

    // POST ONLY

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

        // VERIFY USER

        const user = await verifyUser(event);

        // READ BODY

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

        const action = body.action;

        // ==============================================
        // ACTION 1: PLAYER NAME CHECK
        // ==============================================

        if (action === "name-check") {

            const uid =
                String(body.uid || "").trim();

            if (!uid) {

                return response(
                    400,
                    {
                        success: false,
                        message: "Player ID is required."
                    },
                    origin
                );

            }

            const aluResult = await checkPlayer(uid);

            return response(
                200,
                {
                    success: true,
                    message: "Player verification response received.",
                    player_id: uid,
                    data: aluResult
                },
                origin
            );

        }

        // ==============================================
        // ACTION 2: PRODUCTS
        // ==============================================

        if (action === "products") {

            return response(
                410,
                {
                    success: false,
                    message:
                        "Products must be loaded directly from Supabase."
                },
                origin
            );

        }

        // ==============================================
        // ACTION 3: PURCHASE
        // ==============================================

        if (action === "purchase") {

            return response(
                501,
                {
                    success: false,
                    message:
                        "Secure purchase processing is not enabled yet."
                },
                origin
            );

        }

        // ==============================================
        // UNKNOWN ACTION
        // ==============================================

        return response(
            400,
            {
                success: false,
                message: "Unknown action."
            },
            origin
        );

    } catch (error) {

        console.error(
            "FREE FIRE BACKEND ERROR:",
            error
        );

        if (
            error.message === "LOGIN_REQUIRED" ||
            error.message === "INVALID_SESSION"
        ) {

            return response(
                401,
                {
                    success: false,
                    message: "Please login again."
                },
                origin
            );

        }

        if (error.message === "INVALID_PLAYER_ID") {

            return response(
                400,
                {
                    success: false,
                    message: "Invalid Free Fire Player ID."
                },
                origin
            );

        }

        if (error.message === "SUPABASE_CONFIGURATION_ERROR") {

            return response(
                500,
                {
                    success: false,
                    message: "Supabase server configuration error."
                },
                origin
            );

        }

        if (error.message === "ALU_CONFIGURATION_ERROR") {

            return response(
                500,
                {
                    success: false,
                    message: "ALU API configuration error."
                },
                origin
            );

        }

        if (error.name === "AbortError") {

            return response(
                504,
                {
                    success: false,
                    message: "ALU request timed out."
                },
                origin
            );

        }

        return response(
            500,
            {
                success: false,
                message:
                    "Unable to process your request. Please try again."
            },
            origin
        );

    }

};

// ======================================================
// END OF FREE FIRE BACKEND
// ======================================================