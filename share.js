const shareButton = document.getElementById('share-game-over');
const shareStatus = document.getElementById('share-status');
const shareActions = document.getElementById('share-actions');
const downloadResult = document.getElementById('download-game-over');
const openXPost = document.getElementById('open-x-post');
const gameUrl = 'https://safety-tomato-game.pages.dev/';

let resultImage = null;

window.prepareGameOverShare = (gameCanvas, score, tomatoes) => {
    const image = document.createElement('canvas');
    image.width = 700;
    image.height = 1120;
    const context = image.getContext('2d');

    context.fillStyle = '#FFD1DC';
    context.fillRect(0, 0, image.width, image.height);
    context.fillStyle = '#8B4513';
    context.textAlign = 'center';
    context.font = '40px MisakiGothic, sans-serif';
    context.fillText('安心トマトゲーム', 350, 58);
    context.font = '34px MisakiGothic, sans-serif';
    context.fillText('Game Over！', 350, 108);

    context.drawImage(gameCanvas, 40, 130, 620, 860);
    context.strokeStyle = '#8B4513';
    context.lineWidth = 2;
    context.strokeRect(39, 129, 622, 862);

    context.fillStyle = '#8B4513';
    context.font = '30px MisakiGothic, sans-serif';
    context.fillText(`スコア: ${score}点　トマト: ${tomatoes}個`, 350, 1052);
    context.font = '26px MisakiGothic, sans-serif';
    context.fillText('#安心トマトゲーム', 350, 1095);

    try {
        image.toBlob((blob) => {
            if (!blob) {
                shareStatus.textContent = '画像を作れませんでした。画面を撮影して投稿してください。';
                return;
            }
            resultImage = new File([blob], 'anshin-tomato-result.png', { type: 'image/png' });
            downloadResult.href = URL.createObjectURL(blob);
            openXPost.href = 'https://x.com/intent/tweet?text=' + encodeURIComponent(
                `安心トマトゲームで${score}点！ トマト${tomatoes}個 🍅 #安心トマトゲーム\n${gameUrl}`
            );
            shareActions.hidden = false;
            shareButton.disabled = false;
            shareStatus.textContent = '共有先にXが表示されたら選択してください。';
        }, 'image/png');
    } catch (error) {
        shareStatus.textContent = '画像を作れませんでした。画面を撮影して投稿してください。';
    }
};

shareButton.addEventListener('click', async () => {
    if (!resultImage) return;

    // 対応端末では画像を X アプリなどの共有先へ直接渡す。
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [resultImage] })) {
        try {
            await navigator.share({
                files: [resultImage],
                title: '安心トマトゲーム',
                text: new URL(openXPost.href).searchParams.get('text')
            });
            shareStatus.textContent = '共有画面を開きました。';
            return;
        } catch (error) {
            if (error.name === 'AbortError') {
                shareStatus.textContent = '共有をキャンセルしました。';
                return;
            }
        }
    }

    // X の Web 投稿画面へ画像を直接添付する仕組みはないため、保存用リンクも表示する。
    window.open(openXPost.href, '_blank', 'noopener,noreferrer');
    shareStatus.textContent = '画像を保存して、Xの投稿画面に添付してください。';
});
