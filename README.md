# alt tasks tree 

Интерфейс для взаимодействия с 'https://rdb.altlinux.org/api/site/tasks_history':

1. Дерево задач по 'prev/branch'
2. Рендер через виртуализацию (react-window)
3. Поиск осуществляется по 'task_id'

## Запуск через Makefile (docker/podman):

make RUNTIME=podman build
make RUNTIME=podman run
# http://localhost:8080