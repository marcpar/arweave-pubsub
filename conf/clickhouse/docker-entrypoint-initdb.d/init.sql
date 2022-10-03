CREATE DATABASE IF NOT EXISTS grafana;

CREATE USER IF NOT EXISTS grafana@'%' IDENTIFIED WITH plaintext_password BY 'password123';
CREATE USER IF NOT EXISTS grafana_insert@'%' IDENTIFIED WITH plaintext_password BY 'password123';

GRANT SELECT ON grafana.* TO grafana;
GRANT SELECT, INSERT, CREATE TABLE ON grafana.* TO grafana_insert;

USE grafana;

CREATE TABLE IF NOT EXISTS t_docker_logs(
    `time` DateTime,
    `log` String,
    `log_path` String,
    `stream` String
) ENGINE = MergeTree()
ORDER BY (time, log_path);

CREATE TABLE IF NOT EXISTS t_near_processor_logs(
    `time` DateTime,
    `message` String,
    `level` String,
    `log_type` String,
    `job_id` String,
    `service_name` String,
    `hostname` String
) ENGINE = MergeTree()
ORDER BY (time, service_name)