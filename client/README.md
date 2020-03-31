# client2

docker build -t dandelea/ygo -f Dockerfile.dev .

docker run -p 8080:8080 -v /app/node_modules -v $(pwd):/app -t dandelea/ygo