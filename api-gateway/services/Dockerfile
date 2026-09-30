# Stage 1: compile the Go binary
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod main.go ./
RUN CGO_ENABLED=0 go build -o service .

# Stage 2: tiny runtime image with only the binary
FROM alpine:3.20
WORKDIR /app
COPY --from=builder /app/service .
CMD ["./service"]
