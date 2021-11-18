# Conditional access - Gateway

Conditional access gateway for managing multiple worker nodes (for various providers)

## Setup

The gateway node needs to be started before the worker nodes. After registering a first time the gateway can be rebooted and the worker nodes can be restarted (as long as a gateway is active at the time of restart)

## Installation

1. Install a PostgreSQL database
2. Set up the configuration file

```js
const config = {
    server:{
        cors: {
            enabled: false,
            origin: []
        },
        https: {
            enabled: false,
            key: "",
            cert: "",
            port: 443
        },
        http:{
            enabled: true,
            port: 8080
        }
    },
    database:{
        refreshRate: 20000,
        connection: "postgres://spacenextdoor:2Y=hwW4JVjKZ7m=N@localhost:5432/spacenextdoor"
    }
}

module.exports = config;
```
Note: Only enable HTTP or HTTPS not both at the same time

## Usage
Start the server:

```bash
node server.js
```