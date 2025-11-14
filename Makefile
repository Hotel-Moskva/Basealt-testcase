
RUNTIME ?= docker
IMG     ?= alt-tasks-tree
TAG     ?= latest
PORT    ?= 8080

IMAGE := $(IMG):$(TAG)
PORT_CLEAN := $(strip $(PORT))

.PHONY: help build run stop logs shell rm-image clean compose-up compose-down podman-unit podman-enable

help:
	@echo "Targets:"
	@echo "  make build           - собрать образ ($(IMAGE)) (VITE_API_BASE=$(API_BASE))"
	@echo "  make run             - запустить контейнер на порту $(PORT)"
	@echo "  make stop            - остановить/удалить контейнер"
	@echo "  make logs            - показать логи"
	@echo "  make shell           - зайти внутрь контейнера (sh)"
	@echo "  make rm-image        - удалить образ"
	@echo "  make clean           - stop + rm-image"
	@echo "  make compose-up      - собрать и поднять через docker compose (если есть compose.yml)"
	@echo "  make compose-down    - остановить compose"
	@echo "  make podman-unit     - (rootless) сгенерировать systemd unit для Podman"
	@echo "  make podman-enable   - включить и запустить unit (user service)"
	@echo ""
	@echo "Примеры:"
	@echo "  make build API_BASE=https://rdb.altlinux.org/api"
	@echo "  make run PORT=9090"
	@echo "  make RUNTIME=podman build run"


build:
	$(RUNTIME) build \
		--build-arg VITE_API_BASE=$(API_BASE) \
		-t $(IMAGE) .


run: stop
	$(RUNTIME) run --rm \
		--name $(IMG) \
		-p $(PORT_CLEAN):8080 \
		$(IMAGE)

stop:
	-$(RUNTIME) rm -f $(IMG) 2>/dev/null || true

logs:
	$(RUNTIME) logs -f $(IMG)

shell:
	$(RUNTIME) exec -it $(IMG) sh

rm-image:
	-$(RUNTIME) rmi $(IMAGE) 2>/dev/null || true

clean: stop rm-image


compose-up:
	DOCKER_BUILDKIT=1 docker compose up --build

compose-down:
	docker compose down


podman-unit:
	@if [ "$(RUNTIME)" != "podman" ]; then echo "RUNTIME!=podman: запускай так: make RUNTIME=podman podman-unit"; exit 1; fi
	
	-$(RUNTIME) rm -f $(IMG) 2>/dev/null || true
	$(RUNTIME) create --name $(IMG) -p $(PORT):8080 localhost/$(IMAGE)
	
	mkdir -p $$HOME/.config/systemd/user
	$(RUNTIME) generate systemd --new --name $(IMG) > $$HOME/.config/systemd/user/$(IMG).service
	@echo "Unit сгенерирован: $$HOME/.config/systemd/user/$(IMG).service"

podman-enable:
	systemctl --user daemon-reload
	systemctl --user enable --now $(IMG).service
	
	loginctl enable-linger $$USER || true
	@echo "User service $(IMG).service запущен"
