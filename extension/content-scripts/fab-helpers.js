// FAB Helpers - lightweight positioning + vertical drag (no deps)
// positionPanel: places a panel relative to an anchor and keeps it in viewport
// makeVerticalDraggable: adds Y-axis drag with clamping callbacks

(function () {
    function clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
    }

    function positionPanel(anchorEl, panelEl, options = {}) {
        if (!anchorEl || !panelEl) return;
        const { gap = 8, flip = true, align = 'end' } = options;

        const anchorRect = anchorEl.getBoundingClientRect();
        const panelRect = panelEl.getBoundingClientRect();

        let top = anchorRect.bottom + gap;
        let left = anchorRect.right - panelRect.width; // align end

        // Clamp horizontally
        const maxLeft = window.innerWidth - panelRect.width - 8;
        left = clamp(left, 8, maxLeft);

        // Flip above if overflowing bottom
        if (flip && top + panelRect.height > window.innerHeight) {
            const flippedTop = anchorRect.top - panelRect.height - gap;
            if (flippedTop >= 8) top = flippedTop;
        }

        panelEl.style.position = 'fixed';
        panelEl.style.left = `${left}px`;
        panelEl.style.top = `${top}px`;
    }

    function makeVerticalDraggable(targetEl, opts = {}) {
        if (!targetEl) return;
        const { onMove, minTop = 20, maxTop = () => Math.max(80, window.innerHeight - 200) } = opts;

        let dragging = false;
        let startY = 0;
        let startTop = 0;

        const start = (clientY) => {
            dragging = true;
            startY = clientY;
            const currentTop = parseFloat(targetEl.style.top || '0') || targetEl.getBoundingClientRect().top;
            startTop = currentTop;
        };

        const move = (clientY) => {
            if (!dragging) return;
            const delta = clientY - startY;
            const max = typeof maxTop === 'function' ? maxTop() : maxTop;
            const newTop = clamp(startTop + delta, minTop, max);
            if (onMove) onMove(newTop);
        };

        const end = () => {
            dragging = false;
        };

        // Pointer events
        targetEl.addEventListener('pointerdown', (e) => {
            if (e.button === 2) return;
            start(e.clientY);
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
            window.addEventListener('pointercancel', onPointerUp);
        });

        const onPointerMove = (e) => move(e.clientY);
        const onPointerUp = () => {
            end();
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };

        // Touch events
        targetEl.addEventListener('touchstart', (e) => {
            const t = e.touches?.[0];
            if (!t) return;
            start(t.clientY);
            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('touchend', onTouchEnd);
            window.addEventListener('touchcancel', onTouchEnd);
        }, { passive: true });

        const onTouchMove = (e) => {
            const t = e.touches?.[0];
            if (!t) return;
            e.preventDefault();
            move(t.clientY);
        };
        const onTouchEnd = () => {
            end();
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchEnd);
        };
    }

    window.FABHelpers = { positionPanel, makeVerticalDraggable };
})();
