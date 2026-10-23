const rankingList = document.getElementById('ranking-list');
const rankingStatus = document.getElementById('ranking-status');
const scoreForm = document.getElementById('score-form');
const submitStatus = document.getElementById('score-submit-status');
const submitButton = document.getElementById('submit-score');
const nameInput = document.getElementById('player-name');
const turnstileContainer = document.getElementById('turnstile-container');
const restartButton = document.getElementById('restart-game');

let siteKey = '';
let turnstileToken = '';
let widgetId = null;
let finalScoreX2 = null;
let finalTomatoes = 0;
let turnstileLoading = null;

async function loadRanking() {
    try {
        const response = await fetch('/api/leaderboard', { cache: 'no-store' });
        if (!response.ok) throw new Error('ランキングを取得できませんでした');
        const data = await response.json();
        siteKey = data.siteKey;
        rankingList.replaceChildren();
        for (const entry of data.scores) {
            const item = document.createElement('li');
            item.textContent = entry.name + ' — ' + (entry.scoreX2 / 2) + '点';
            rankingList.appendChild(item);
        }
        rankingStatus.textContent = data.scores.length ? '' : 'まだ記録がありません';
        if (finalScoreX2 !== null) await prepareTurnstile();
    } catch (error) {
        rankingStatus.textContent = 'ランキングは準備中です';
        if (finalScoreX2 !== null) submitStatus.textContent = 'ランキングは準備中です';
    }
}

function loadTurnstileScript() {
    if (window.turnstile) return Promise.resolve();
    if (!turnstileLoading) {
        turnstileLoading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('認証画面を読み込めませんでした'));
            document.head.appendChild(script);
        });
    }
    return turnstileLoading;
}

async function prepareTurnstile() {
    if (!siteKey || widgetId !== null) return;
    try {
        await loadTurnstileScript();
        widgetId = window.turnstile.render(turnstileContainer, {
            sitekey: siteKey,
            size: 'compact',
            action: 'score-submit',
            callback(token) {
                turnstileToken = token;
                submitButton.disabled = false;
            },
            'expired-callback'() {
                turnstileToken = '';
                submitButton.disabled = true;
            },
            'error-callback'() {
                turnstileToken = '';
                submitButton.disabled = true;
                submitStatus.textContent = '認証に失敗しました。再読み込みしてください';
            }
        });
    } catch (error) {
        submitStatus.textContent = error.message;
    }
}

window.showGameOverRankingForm = (score, tomatoes) => {
    finalScoreX2 = Math.round(score * 2);
    finalTomatoes = tomatoes;
    document.getElementById('final-score').textContent = '今回のスコア: ' + score + '点';
    if (siteKey) prepareTurnstile();
    else submitStatus.textContent = 'ランキングを確認中…';
};

scoreForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!turnstileToken || finalScoreX2 === null) return;
    submitButton.disabled = true;
    submitStatus.textContent = '登録中…';
    try {
        const response = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: nameInput.value,
                scoreX2: finalScoreX2,
                tomatoes: finalTomatoes,
                token: turnstileToken
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '登録できませんでした');
        submitStatus.textContent = '登録しました！';
        scoreForm.hidden = true;
        await loadRanking();
    } catch (error) {
        submitStatus.textContent = error.message;
        turnstileToken = '';
        if (widgetId !== null) window.turnstile.reset(widgetId);
    }
});

restartButton.addEventListener('click', () => window.location.reload());

loadRanking();
