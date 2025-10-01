-- =========================================================
-- Inicialización de BD para Unidad 3 (MySQL 8)
-- Crea esquemas, otorga permisos al usuario 'app',
-- crea tablas y datos semilla.
-- =========================================================

-- 1) Esquemas con charset/collation recomendados
CREATE DATABASE IF NOT EXISTS usuarios_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS proyectos_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2) Permisos para el usuario 'app' (creado por variables del contenedor)
--    IMPORTANTE: sin estos grants 'proyectos-api' no puede escribir en proyectos_db
GRANT ALL PRIVILEGES ON usuarios_db.*  TO 'app'@'%';
GRANT ALL PRIVILEGES ON proyectos_db.* TO 'app'@'%';
FLUSH PRIVILEGES;

-- =========================================================
-- 3) Esquema USUARIOS
-- =========================================================
DROP TABLE IF EXISTS usuarios_db.usuarios;

CREATE TABLE usuarios_db.usuarios (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(120) NOT NULL,
  email     VARCHAR(160) NOT NULL UNIQUE,
  hash      VARCHAR(200) NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: password = "secret"
INSERT INTO usuarios_db.usuarios (nombre, email, hash) VALUES
('Ada Lovelace','ada@example.com','$2a$10$CwTycUXWue0Thq9StjUM0uJ8WcOqKq7n1t42ZT3zh/OEl8rmnE9lO');

-- =========================================================
-- 4) Esquema PROYECTOS
-- =========================================================
-- Drop en orden por FK
DROP TABLE IF EXISTS proyectos_db.tareas;
DROP TABLE IF EXISTS proyectos_db.proyectos;

CREATE TABLE proyectos_db.proyectos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(160) NOT NULL,
  descripcion       TEXT,
  owner_usuario_id  INT NOT NULL,
  creado_en         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proyectos_db.tareas (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  proyecto_id            INT NOT NULL,
  titulo                 VARCHAR(200) NOT NULL,
  estado                 ENUM('todo','doing','done') NOT NULL DEFAULT 'todo',
  asignado_a_usuario_id  INT,
  creado_en              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tareas_proyecto
    FOREIGN KEY (proyecto_id) REFERENCES proyectos_db.proyectos(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices útiles
CREATE INDEX idx_proyectos_owner ON proyectos_db.proyectos (owner_usuario_id);
CREATE INDEX idx_tareas_proyecto ON proyectos_db.tareas (proyecto_id);

-- Seeds mínimos
INSERT INTO proyectos_db.proyectos (nombre,descripcion,owner_usuario_id)
VALUES ('Proyecto semilla','Backlog inicial',1);

INSERT INTO proyectos_db.tareas (proyecto_id,titulo,estado,asignado_a_usuario_id)
VALUES (1,'Configurar repositorio','doing',1);
