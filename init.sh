#!/bin/bash

tmux new -d -s eureka
tmux send-keys -t eureka 'cd eureka;./mvnw spring-boot:run' C-m

tmux new -d -s media-service
tmux send-keys -t media-service 'cd media-service/service;./mvnw spring-boot:run' C-m

tmux new -d -s media-service-db
tmux send-keys -t media-service-db 'cd media-service/db;sudo ./init.sh' C-m


tmux new -d -s product-service
tmux send-keys -t product-service 'cd product-service/service;./mvnw spring-boot:run' C-m


tmux new -d -s product-service-db
tmux send-keys -t product-service-db 'cd product-service/db;sudo ./init.sh' C-m


tmux new -d -s user-service
tmux send-keys -t user-service 'cd user-service/service;./mvnw spring-boot:run' C-m

tmux new -d -s user-service-db
tmux send-keys -t user-service-db 'cd user-service/db;sudo ./init.sh' C-m
