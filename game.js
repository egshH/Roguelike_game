$(document).ready(function() {
    const MAP_WIDTH = 40;
    const MAP_HEIGHT = 24;
    const WALL = 0;
    const FLOOR = 1;
    const PLAYER = 2;
    const ENEMY = 3;
    const SWORD = 4;
    const POTION = 5;
    
    let gameMap = [];
    let player = {
        x: 0,
        y: 0,
        health: 100,
        maxHealth: 100,
        attack: 5,
        visibilityRadius: 6 // Радиус видимости игрока для врагов
    };
    let enemies = [];
    let swords = [];
    let potions = [];
    let criticalPoints = []; // Маршрутные точки, которые не должны блокироваться
    
    let keyState = {
        'w': false,
        'a': false,
        's': false,
        'd': false
    };
    
    function initMap() {
        gameMap = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                row.push(WALL);
            }
            gameMap.push(row);
        }
        criticalPoints = []; // Сброс маршрутных точек
    }
    
    function generateRooms() {
        const numRooms = Math.floor(Math.random() * 6) + 5;
        const rooms = [];
        
        for (let i = 0; i < numRooms; i++) {
            const roomWidth = Math.floor(Math.random() * 6) + 3;
            const roomHeight = Math.floor(Math.random() * 6) + 3;
            const roomX = Math.floor(Math.random() * (MAP_WIDTH - roomWidth - 2)) + 1;
            const roomY = Math.floor(Math.random() * (MAP_HEIGHT - roomHeight - 2)) + 1;
            
            let intersects = false;
            for (const room of rooms) {
                if (
                    roomX < room.x + room.width + 1 &&
                    roomX + roomWidth + 1 > room.x &&
                    roomY < room.y + room.height + 1 &&
                    roomY + roomHeight + 1 > room.y
                ) {
                    intersects = true;
                    break;
                }
            }
            
            if (!intersects) {
                for (let y = roomY; y < roomY + roomHeight; y++) {
                    for (let x = roomX; x < roomX + roomWidth; x++) {
                        gameMap[y][x] = FLOOR;
                    }
                }
                
                rooms.push({
                    x: roomX,
                    y: roomY,
                    width: roomWidth,
                    height: roomHeight
                });
            }
        }
        
        return rooms;
    }
    
    function generateCorridors(rooms) {
        if (rooms.length === 0) return;
        
        // Создаем список всех возможных соединений между комнатами
        const connections = [];
        for (let i = 0; i < rooms.length; i++) {
            for (let j = i + 1; j < rooms.length; j++) {
                const room1CenterX = rooms[i].x + Math.floor(rooms[i].width / 2);
                const room1CenterY = rooms[i].y + Math.floor(rooms[i].height / 2);
                const room2CenterX = rooms[j].x + Math.floor(rooms[j].width / 2);
                const room2CenterY = rooms[j].y + Math.floor(rooms[j].height / 2);
                
                const distance = Math.abs(room1CenterX - room2CenterX) + Math.abs(room1CenterY - room2CenterY);
                
                connections.push({
                    from: i,
                    to: j,
                    distance: distance
                });
            }
        }
        
        // Сортируем соединения по расстоянию
        connections.sort((a, b) => a.distance - b.distance);
        
        const connected = Array(rooms.length).fill(false);
        connected[0] = true;
        
        // Создаем минимальное остовное дерево
        while (connected.some(c => !c)) {
            for (const connection of connections) {
                if (connected[connection.from] !== connected[connection.to]) {
                    const fromRoom = connected[connection.from] ? connection.from : connection.to;
                    const toRoom = connected[connection.from] ? connection.to : connection.from;
                    
                    const room1 = rooms[fromRoom];
                    const room2 = rooms[toRoom];
                    
                    const room1CenterX = room1.x + Math.floor(room1.width / 2);
                    const room1CenterY = room1.y + Math.floor(room1.height / 2);
                    const room2CenterX = room2.x + Math.floor(room2.width / 2);
                    const room2CenterY = room2.y + Math.floor(room2.height / 2);
                    
                    // Горизонтальный проход
                    let x = room1CenterX;
                    while (x !== room2CenterX) {
                        gameMap[room1CenterY][x] = FLOOR;
                        x += (room2CenterX > room1CenterX) ? 1 : -1;
                    }
                    
                    // Вертикальный проход
                    let y = room1CenterY;
                    while (y !== room2CenterY) {
                        gameMap[y][room2CenterX] = FLOOR;
                        y += (room2CenterY > room1CenterY) ? 1 : -1;
                    }
                    
                    // Добавляем ключевые маршрутные точки
                    addCriticalPoints(room1CenterX, room1CenterY, room2CenterX, room2CenterY);
                    
                    connected[toRoom] = true;
                    break;
                }
            }
        }
        
        // Добавляем дополнительные проходы для большей связности
        const additionalCorridors = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < additionalCorridors; i++) {
            const room1Index = Math.floor(Math.random() * rooms.length);
            const room2Index = Math.floor(Math.random() * rooms.length);
            
            if (room1Index !== room2Index) {
                const room1 = rooms[room1Index];
                const room2 = rooms[room2Index];
                
                const room1CenterX = room1.x + Math.floor(room1.width / 2);
                const room1CenterY = room1.y + Math.floor(room1.height / 2);
                const room2CenterX = room2.x + Math.floor(room2.width / 2);
                const room2CenterY = room2.y + Math.floor(room2.height / 2);
                
                // Горизонтальный проход
                let x = room1CenterX;
                while (x !== room2CenterX) {
                    gameMap[room1CenterY][x] = FLOOR;
                    x += (room2CenterX > room1CenterX) ? 1 : -1;
                }
                
                // Вертикальный проход
                let y = room1CenterY;
                while (y !== room2CenterY) {
                    gameMap[y][room2CenterX] = FLOOR;
                    y += (room2CenterY > room1CenterY) ? 1 : -1;
                }
                
                // Добавляем ключевые маршрутные точки для дополнительных проходов
                addCriticalPoints(room1CenterX, room1CenterY, room2CenterX, room2CenterY);
            }
        }
    }
    
    // Добавляет ключевые маршрутные точки в проходы
    function addCriticalPoints(x1, y1, x2, y2) {
        // Добавляем точки в углах проходов
        criticalPoints.push({x: x1, y: y1});
        criticalPoints.push({x: x2, y: y2});
        
        // Добавляем точки в пересечениях проходов (углы)
        if (x1 !== x2 && y1 !== y2) {
            criticalPoints.push({x: x1, y: y2});
            criticalPoints.push({x: x2, y: y1});
        }
    }
    
    // Проверяет, является ли позиция критической маршрутной точкой
    function isCriticalPoint(x, y) {
        return criticalPoints.some(point => point.x === x && point.y === y);
    }
    
    // Проверяет, находится ли позиция рядом с критической точкой
    function isNearCriticalPoint(x, y) {
        return criticalPoints.some(point => 
            Math.abs(point.x - x) <= 1 && Math.abs(point.y - y) <= 1
        );
    }
    
    function findFreePosition(avoidCritical = false) {
        let x, y;
        let maxAttempts = 1000;
        let attempts = 0;
        
        do {
            x = Math.floor(Math.random() * MAP_WIDTH);
            y = Math.floor(Math.random() * MAP_HEIGHT);
            attempts++;
            
            if (attempts > maxAttempts) {
                // Если не можем найти позицию, уменьшаем требования
                avoidCritical = false;
            }
        } while (
            gameMap[y][x] !== FLOOR || 
            (avoidCritical && (isCriticalPoint(x, y) || isNearCriticalPoint(x, y)))
        );
        
        return {x, y};
    }
    
    function isValidMove(x, y) {
        return x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT &&
               gameMap[y][x] !== WALL;
    }
    
    function isEnemyAtPosition(x, y) {
        for (const enemy of enemies) {
            if (enemy.x === x && enemy.y === y) {
                return true;
            }
        }
        return false;
    }
    
    function placeItems() {
        // Мечи (2 шт) - можно размещать где угодно
        for (let i = 0; i < 2; i++) {
            const pos = findFreePosition();
            gameMap[pos.y][pos.x] = SWORD;
            swords.push({x: pos.x, y: pos.y});
        }
        
        // Зелья (10 шт) - можно размещать где угодно
        for (let i = 0; i < 10; i++) {
            const pos = findFreePosition();
            gameMap[pos.y][pos.x] = POTION;
            potions.push({x: pos.x, y: pos.y});
        }
        
        // Противники (10 шт) - избегаем критических точек
        for (let i = 0; i < 10; i++) {
            const pos = findFreePosition(true);
            gameMap[pos.y][pos.x] = ENEMY;
            enemies.push({
                x: pos.x,
                y: pos.y,
                health: 30,
                awarenessRadius: 5 // Радиус обнаружения игрока
            });
        }
        
        // Игрок - избегаем критических точек
        const playerPos = findFreePosition(true);
        gameMap[playerPos.y][playerPos.x] = PLAYER;
        player.x = playerPos.x;
        player.y = playerPos.y;
    }
    
    function renderMap() {
        $('.field').empty();
        
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = $('<div class="tile"></div>');
                
                switch (gameMap[y][x]) {
                    case WALL:
                        tile.addClass('wall');
                        break;
                    case FLOOR:
                        tile.addClass('floor');
                        break;
                    case PLAYER:
                        tile.addClass('player');
                        break;
                    case ENEMY:
                        tile.addClass('enemy');
                        break;
                    case SWORD:
                        tile.addClass('sword');
                        break;
                    case POTION:
                        tile.addClass('potion');
                        break;
                }
                
                $('.field').append(tile);
            }
        }
        
        $('.health').css('width', (player.health / player.maxHealth * 100) + '%');
        $('.attack-value').text(player.attack);
    }
    
    function updatePlayerPosition(oldX, oldY) {
        gameMap[oldY][oldX] = FLOOR;
        gameMap[player.y][player.x] = PLAYER;
    }
    
    function updateEnemyPosition(enemy, oldX, oldY) {
        gameMap[oldY][oldX] = FLOOR;
        gameMap[enemy.y][enemy.x] = ENEMY;
    }
    
    function isAdjacent(x1, y1, x2, y2) {
        return (Math.abs(x1 - x2) === 1 && y1 === y2) || (x1 === x2 && Math.abs(y1 - y2) === 1);
    }
    
    function isValidEnemyMove(x, y) {
        return x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT &&
               gameMap[y][x] !== WALL &&
               !(x === player.x && y === player.y) &&
               !isEnemyAtPosition(x, y);
    }
    
    function movePlayer(dx, dy) {
        const newX = player.x + dx;
        const newY = player.y + dy;
        
        if (isValidMove(newX, newY)) {
            const oldX = player.x;
            const oldY = player.y;
            
            if (gameMap[newY][newX] === ENEMY) {
                for (let i = 0; i < enemies.length; i++) {
                    if (enemies[i].x === newX && enemies[i].y === newY) {
                        enemies[i].health -= player.attack;
                        
                        if (enemies[i].health <= 0) {
                            gameMap[newY][newX] = FLOOR;
                            enemies.splice(i, 1);
                            checkWinCondition();
                        }
                        
                        break;
                    }
                }
            } else {
                if (gameMap[newY][newX] === SWORD) {
                    player.attack += 5;
                    gameMap[newY][newX] = FLOOR;
                    
                    for (let i = 0; i < swords.length; i++) {
                        if (swords[i].x === newX && swords[i].y === newY) {
                            swords.splice(i, 1);
                            break;
                        }
                    }
                }
                
                if (gameMap[newY][newX] === POTION) {
                    player.health = Math.min(player.maxHealth, player.health + 30);
                    gameMap[newY][newX] = FLOOR;
                    
                    for (let i = 0; i < potions.length; i++) {
                        if (potions[i].x === newX && potions[i].y === newY) {
                            potions.splice(i, 1);
                            break;
                        }
                    }
                }
                
                player.x = newX;
                player.y = newY;
                updatePlayerPosition(oldX, oldY);
            }
            
            moveEnemies();
            checkEnemyAttacks();
            renderMap();
        }
    }
    
    function attackPlayer() {
        let enemiesAttacked = 0;
        
        const directions = [
            {dx: 0, dy: -1},
            {dx: 1, dy: 0},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0}
        ];
        
        for (const dir of directions) {
            const x = player.x + dir.dx;
            const y = player.y + dir.dy;
            
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && gameMap[y][x] === ENEMY) {
                for (let i = 0; i < enemies.length; i++) {
                    if (enemies[i].x === x && enemies[i].y === y) {
                        enemies[i].health -= player.attack;
                        
                        if (enemies[i].health <= 0) {
                            gameMap[y][x] = FLOOR;
                            enemies.splice(i, 1);
                            checkWinCondition();
                        }
                        
                        enemiesAttacked++;
                        break;
                    }
                }
            }
        }
        
        if (enemiesAttacked > 0) {
            checkEnemyAttacks();
            renderMap();
        }
    }
    
    function moveEnemies() {
        const shuffledEnemies = [...enemies].sort(() => Math.random() - 0.5);
        
        for (const enemy of shuffledEnemies) {
            const enemyIndex = enemies.findIndex(e => e.x === enemy.x && e.y === enemy.y);
            if (enemyIndex === -1) continue;
            
            const oldX = enemy.x;
            const oldY = enemy.y;
            
            // Проверяем, находится ли игрок в зоне видимости врага
            const distanceToPlayer = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
            const inSight = distanceToPlayer <= enemy.awarenessRadius;
            
            if (isAdjacent(enemy.x, enemy.y, player.x, player.y)) {
                continue;
            }
            
            // Если игрок не в зоне видимости, враг не двигается к игроку
            if (!inSight) {
                // Но проверяем, не находится ли враг рядом с критической точкой
                if (isNearCriticalPoint(enemy.x, enemy.y)) {
                    // Если да, то враг может случайно двигаться, чтобы не блокировать проход
                    tryRandomMovement(enemy, oldX, oldY);
                }
                continue;
            }
            
            let dx = 0, dy = 0;
            
            if (enemy.x < player.x) dx = 1;
            else if (enemy.x > player.x) dx = -1;
            
            if (enemy.y < player.y) dy = 1;
            else if (enemy.y > player.y) dy = -1;
            
            if (Math.random() < 0.5) {
                if (dx !== 0) {
                    const newX = enemy.x + dx;
                    const newY = enemy.y;
                    
                    if (isValidEnemyMove(newX, newY) && !wouldBlockCriticalPath(newX, newY)) {
                        enemy.x = newX;
                        enemy.y = newY;
                        updateEnemyPosition(enemy, oldX, oldY);
                        continue;
                    }
                }
                
                if (dy !== 0) {
                    const newX = enemy.x;
                    const newY = enemy.y + dy;
                    
                    if (isValidEnemyMove(newX, newY) && !wouldBlockCriticalPath(newX, newY)) {
                        enemy.x = newX;
                        enemy.y = newY;
                        updateEnemyPosition(enemy, oldX, oldY);
                        continue;
                    }
                }
            } else {
                if (dy !== 0) {
                    const newX = enemy.x;
                    const newY = enemy.y + dy;
                    
                    if (isValidEnemyMove(newX, newY) && !wouldBlockCriticalPath(newX, newY)) {
                        enemy.x = newX;
                        enemy.y = newY;
                        updateEnemyPosition(enemy, oldX, oldY);
                        continue;
                    }
                }
                
                if (dx !== 0) {
                    const newX = enemy.x + dx;
                    const newY = enemy.y;
                    
                    if (isValidEnemyMove(newX, newY) && !wouldBlockCriticalPath(newX, newY)) {
                        enemy.x = newX;
                        enemy.y = newY;
                        updateEnemyPosition(enemy, oldX, oldY);
                        continue;
                    }
                }
            }
            
            // Если не можем двигаться к игроку, делаем случайное движение
            tryRandomMovement(enemy, oldX, oldY);
            
            enemies[enemyIndex] = enemy;
        }
    }
    
    // Проверяет, будет ли перемещение блокировать критический путь
    function wouldBlockCriticalPath(x, y) {
        // Если перемещение происходит на критическую точку или блокирует проход к ней
        return isCriticalPoint(x, y) || 
               (isNearCriticalPoint(x, y) && wouldIsolateCriticalPoint(x, y));
    }
    
    // Проверяет, изолирует ли перемещение критическую точку
    function wouldIsolateCriticalPoint(x, y) {
        // Проверяем, не блокируется ли последний путь к критической точке
        for (const point of criticalPoints) {
            if (Math.abs(point.x - x) <= 1 && Math.abs(point.y - y) <= 1) {
                // Проверяем, есть ли другие пути к этой точке
                const adjacentPoints = [
                    {x: point.x + 1, y: point.y},
                    {x: point.x - 1, y: point.y},
                    {x: point.x, y: point.y + 1},
                    {x: point.x, y: point.y - 1}
                ];
                
                let freePaths = 0;
                for (const adj of adjacentPoints) {
                    if (isValidMove(adj.x, adj.y) && 
                        !isEnemyAtPosition(adj.x, adj.y) && 
                        !(adj.x === x && adj.y === y)) {
                        freePaths++;
                    }
                }
                
                // Если после перемещения останется менее 2 свободных путей, это блокирует точку
                return freePaths < 2;
            }
        }
        return false;
    }
    
    // Пробует случайное движение, избегая блокировки критических точек
    function tryRandomMovement(enemy, oldX, oldY) {
        const directions = [
            {dx: 1, dy: 0},
            {dx: -1, dy: 0},
            {dx: 0, dy: 1},
            {dx: 0, dy: -1}
        ];
        
        // Перемешиваем направления
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        
        for (const dir of directions) {
            const newX = enemy.x + dir.dx;
            const newY = enemy.y + dir.dy;
            
            if (isValidEnemyMove(newX, newY) && !wouldBlockCriticalPath(newX, newY)) {
                enemy.x = newX;
                enemy.y = newY;
                updateEnemyPosition(enemy, oldX, oldY);
                break;
            }
        }
    }
    
    function checkEnemyAttacks() {
        for (const enemy of enemies) {
            if (isAdjacent(enemy.x, enemy.y, player.x, player.y)) {
                player.health -= 3;
                
                if (player.health <= 0) {
                    alert('Игра окончена!');
                    initGame();
                    return;
                }
            }
        }
    }
    
    function checkWinCondition() {
        if (enemies.length === 0) {
            alert('Победа! Все враги повержены.');
            initGame();
        }
    }
    
    function initGame() {
        player.health = 100;
        player.maxHealth = 100;
        player.attack = 5;
        
        enemies = [];
        swords = [];
        potions = [];
        
        initMap();
        
        const rooms = generateRooms();
        generateCorridors(rooms);
        placeItems();
        
        renderMap();
    }
    
    $(document).keydown(function(e) {
        if (e.key === 'w' || e.key === 'W') {
            keyState['w'] = true;
            e.preventDefault();
        } else if (e.key === 'a' || e.key === 'A') {
            keyState['a'] = true;
            e.preventDefault();
        } else if (e.key === 's' || e.key === 'S') {
            keyState['s'] = true;
            e.preventDefault();
        } else if (e.key === 'd' || e.key === 'D') {
            keyState['d'] = true;
            e.preventDefault();
        } else if (e.key === ' ') {
            attackPlayer();
            e.preventDefault();
        }
        
        // Обрабатываем движение только если нажата одна клавиша
        if (keyState['w'] && !keyState['a'] && !keyState['s'] && !keyState['d']) {
            movePlayer(0, -1);
        } else if (keyState['a'] && !keyState['w'] && !keyState['s'] && !keyState['d']) {
            movePlayer(-1, 0);
        } else if (keyState['s'] && !keyState['w'] && !keyState['a'] && !keyState['d']) {
            movePlayer(0, 1);
        } else if (keyState['d'] && !keyState['w'] && !keyState['a'] && !keyState['s']) {
            movePlayer(1, 0);
        }
    });
    
    $(document).keyup(function(e) {
        if (e.key === 'w' || e.key === 'W') {
            keyState['w'] = false;
        } else if (e.key === 'a' || e.key === 'A') {
            keyState['a'] = false;
        } else if (e.key === 's' || e.key === 'S') {
            keyState['s'] = false;
        } else if (e.key === 'd' || e.key === 'D') {
            keyState['d'] = false;
        }
    });
    
    initGame();
});