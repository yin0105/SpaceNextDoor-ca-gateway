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