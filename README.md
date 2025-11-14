ALT Tasks Tree (React + PatternFly)

1.Мини-UI для истории задач https://rdb.altlinux.org/api/site/tasks_history:
2.дерево по branch и связям prev;
3.поиск по task_id;
4.виртуализация списка (быстро на больших объёмах).

Быстрый старт (dev)
npm ci        # или npm i
npm run dev   # http://localhost:5173


Базовый URL API берётся из VITE_API_BASE. В dev можно так:

VITE_API_BASE=https://rdb.altlinux.org/api npm run dev

Docker / Podman:
# Docker
docker build -t alt-tasks-tree-pf:latest .
docker run --rm -p 8000:8080 alt-tasks-tree-pf:latest
# http://localhost:8000

# Podman
podman build -t alt-tasks-tree-pf:latest .
podman run  --rm -p 8000:8080 localhost/alt-tasks-tree-pf:latest

Переменные:

VITE_API_BASE — базовый URL API.
В контейнере по умолчанию /api (Nginx внутри проксирует на https://rdb.altlinux.org/api).

Стек:

React + TypeScript + Vite
PatternFly 5 UI
react-window для виртуализации
Nginx в прод-контейнере
