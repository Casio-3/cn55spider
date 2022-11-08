module.exports = {
  apps : [{
    name: 'debug',
    script: 'app.js',
    cwd: './',
    node_args: '--inspect',
    watch: [
        "app.js",
        "routes",
        "helper"
    ],
    ignore_watch: [
        "node_modules",
        "public",
        "views",
        "logs"
    ],
    watch_delay: 1e3,
    /**
     * Log file
     */
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    out_file: './logs/test-out.log',
    error_file: './logs/test-error.log',
    combine_logs: true,

    /**
     * Control flow
     */
    min_uptime: '24h',
    max_memory_restart: '500M',
    max_restarts: 10,
    restart_delay: 4000,
    /**
     * cluster
     */
    // instances: -1,
    exec_mode: 'cluster',
  }]
};
