// controls.js
// Handles WASD and Spacebar

let moveFwd = 0;
let moveRight = 0;
let canJump = false;

export function initControls() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

const onKeyDown = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveFwd = 1;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveRight = -1;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveFwd = -1;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = 1;
            break;
        case 'Space':
            canJump = true;
            break;
    }
};

const onKeyUp = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveFwd = 0;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveRight = 0;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveFwd = 0;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = 0;
            break;
        case 'Space':
            canJump = false;
            break;
    }
};

export function getMoveState() {
    return { moveFwd, moveRight };
}

// Check if jump was pressed and consume the event (return true once)
export function checkJump() {
    if (canJump) {
        canJump = false; // Reset immediately to prevent flying
        return true;
    }
    return false;
}