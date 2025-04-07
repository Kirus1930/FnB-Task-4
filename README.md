# FnB-Task-4
Для запуска пользовательского сервера введите в командной строке node frontend/front-server.js

Для запуска сервера администрирования введите в командной строке node admin/admin-server.js

Для запуска WebSocket сервера введите в командной строке node chat-server.js
Для отправки запросов необходимо воспользоваться Postman или curl.

Пример запроса на добавление товара:
curl -X POST -H "Content-Type: application/json" -d '{
  "name": "Новый товар",
  "price": 999,
  "description": "Описание нового товара",
  "categories": ["Новая категория"]
}' http://localhost:8330/api/products

Установка необходимых зависимостей для работы:
* Для GraphQL - npm install graphql
* Для WebSocket API - npm install ws