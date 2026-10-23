function unavailable() {
    return Response.json({ error: 'ランキングは準備中です' }, { status: 503 });
}

function configured(env) {
    return env.DB && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY;
}

export async function onRequestGet({ env }) {
    if (!configured(env)) return unavailable();
    try {
        const result = await env.DB.prepare(
            'SELECT name, score_x2 AS scoreX2, tomato_count AS tomatoes FROM scores ORDER BY score_x2 DESC, created_at ASC LIMIT 10'
        ).all();
        return Response.json(
            { scores: result.results, siteKey: env.TURNSTILE_SITE_KEY },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (error) {
        console.error('Leaderboard read failed', error);
        return unavailable();
    }
}

export async function onRequestPost({ request, env }) {
    if (!configured(env)) return unavailable();
    if (!request.headers.get('content-type')?.startsWith('application/json')) {
        return Response.json({ error: '入力形式を確認してください' }, { status: 415 });
    }

    let body;
    try {
        const raw = await request.text();
        if (raw.length > 2048) throw new Error('too large');
        body = JSON.parse(raw);
    } catch {
        return Response.json({ error: '入力形式を確認してください' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return Response.json({ error: '入力形式を確認してください' }, { status: 400 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || Array.from(name).length > 16 || /[\u0000-\u001f\u007f]/u.test(name) ||
        !Number.isSafeInteger(body.scoreX2) || body.scoreX2 < 0 || body.scoreX2 > 100000000 ||
        !Number.isSafeInteger(body.tomatoes) || body.tomatoes < 0 || body.tomatoes > 100000 ||
        typeof body.token !== 'string' || !body.token || body.token.length > 2048) {
        return Response.json({ error: '名前かスコアを確認してください' }, { status: 400 });
    }

    try {
        const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: env.TURNSTILE_SECRET_KEY,
                response: body.token,
                remoteip: request.headers.get('CF-Connecting-IP') || undefined
            })
        }).then((response) => response.json());
        if (!verification.success || verification.action !== 'score-submit') {
            return Response.json({ error: '認証に失敗しました。もう一度お試しください' }, { status: 403 });
        }
        await env.DB.prepare(
            'INSERT INTO scores (id, name, score_x2, tomato_count, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), name, body.scoreX2, body.tomatoes, new Date().toISOString()).run();
        return Response.json({ ok: true }, { status: 201 });
    } catch (error) {
        console.error('Leaderboard write failed', error);
        return Response.json({ error: '登録できませんでした。後でもう一度お試しください' }, { status: 503 });
    }
}
