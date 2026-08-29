/**
 * Netlify Serverless Function: Validate Whop License Key
 * Endpoint: /.netlify/functions/validate-license
 * 
 * Verifies customer license key against Whop's License & Membership API.
 * Uses WHOP_API_KEY (or WHOP_API_TOKEN) configured in Netlify Dashboard Environment Variables.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async function (event, context) {
  // Handle HTTP OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Preflight OK' }),
    };
  }

  // Only allow POST or GET
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        valid: false,
        status: 'error',
        message: 'Method Not Allowed. Use POST with JSON body { "key": "YOUR_KEY" }',
      }),
    };
  }

  try {
    let key = '';

    if (event.httpMethod === 'POST') {
      let body = {};
      try {
        body = JSON.parse(event.body || '{}');
      } catch (parseErr) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            valid: false,
            status: 'invalid',
            message: 'Invalid JSON request body.',
          }),
        };
      }
      key = body.key || body.licenseKey || body.license_key || '';
    } else if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      key = params.key || params.licenseKey || params.license_key || '';
    }

    const trimmedKey = String(key || '').trim();

    if (!trimmedKey) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          valid: false,
          status: 'invalid',
          message: 'License key is required. Please paste your Whop license key.',
        }),
      };
    }

    // Retrieve Whop API Token from Netlify environment
    const whopApiKey = process.env.WHOP_API_KEY || process.env.WHOP_API_TOKEN;

    if (!whopApiKey) {
      console.error('[validate-license] Error: WHOP_API_KEY is not configured in Netlify environment variables.');
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          valid: false,
          status: 'error',
          message: 'Server error: WHOP_API_KEY environment variable is not configured in Netlify settings.',
        }),
      };
    }

    // Make secure request to Whop API
    // 1. Try Whop v5 License API endpoint: GET https://api.whop.com/api/v5/licenses/{key}
    const cleanKey = encodeURIComponent(trimmedKey);

    let whopResponse = await fetch(`https://api.whop.com/api/v5/licenses/${cleanKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${whopApiKey.trim()}`,
        'Content-Type': 'application/json',
      },
    });

    // 2. If v5 licenses returns 404, check memberships endpoint: GET https://api.whop.com/api/v2/memberships/{id_or_key}
    if (whopResponse.status === 404) {
      whopResponse = await fetch(`https://api.whop.com/api/v2/memberships/${cleanKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${whopApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
      });
    }

    // If Whop returns 401/403 (Invalid server API token)
    if (whopResponse.status === 401 || whopResponse.status === 403) {
      console.error('[validate-license] Whop API rejected authorization. Check WHOP_API_KEY in Netlify settings.');
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          valid: false,
          status: 'error',
          message: 'Authentication error: Invalid Whop API Token configured on the server.',
        }),
      };
    }

    // If Whop returns 404 (Key not found in database)
    if (whopResponse.status === 404) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          valid: false,
          status: 'invalid',
          message: 'Invalid license key. This key was not found in your Whop account or membership records.',
        }),
      };
    }

    // If Whop returned a successful response (200/201)
    if (whopResponse.ok) {
      const data = await whopResponse.json();

      // Check status field in Whop payload (e.g., "active", "valid", "past_due")
      const rawStatus = (data.status || (data.valid === true ? 'active' : '') || '').toLowerCase();
      const isActive = rawStatus === 'active' || rawStatus === 'valid' || data.valid === true || rawStatus === 'past_due';
      const isExpired = rawStatus === 'expired' || rawStatus === 'cancelled' || rawStatus === 'canceled' || rawStatus === 'terminated' || rawStatus === 'deleted';

      if (isActive && !isExpired) {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            valid: true,
            status: 'valid',
            key: trimmedKey,
            email: data.email || data.user?.email || null,
            expires_at: data.expires_at || null,
            message: 'Whop license verified successfully.',
          }),
        };
      } else {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            valid: false,
            status: isExpired ? 'expired' : 'invalid',
            message: isExpired
              ? 'This Whop license key has expired or was cancelled.'
              : `License status is "${rawStatus || 'inactive'}". Please renew your membership on Whop.`,
          }),
        };
      }
    }

    // Other unexpected HTTP responses from Whop
    const errorText = await whopResponse.text().catch(() => '');
    console.error('[validate-license] Whop API error response:', whopResponse.status, errorText);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        valid: false,
        status: 'invalid',
        message: 'Could not verify license key with Whop. Please check the key and try again.',
      }),
    };
  } catch (error) {
    console.error('[validate-license] Unexpected error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        valid: false,
        status: 'error',
        message: 'Internal server error while verifying license key with Whop.',
      }),
    };
  }
};
