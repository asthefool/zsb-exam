-- 升级脚本：管理端补充模块 + 个人中心扩展（2026-10-15）
-- 适用对象：已按 init.sql 建好的 zsb_exam 库（老库升级用，仅需执行一次）
-- 新装环境直接执行 init.sql 即可，无需本脚本。
-- 用法：mysql -u root -p --default-character-set=utf8mb4 zsb_exam < sql/upgrade-20261015-admin.sql
SET NAMES utf8mb4;
USE zsb_exam;

-- 1. 个人中心：users 增补个人信息字段（昵称之外的可维护资料）
ALTER TABLE users
  ADD COLUMN gender        ENUM('secret','male','female') NOT NULL DEFAULT 'secret' COMMENT '性别：保密/男/女' AFTER nickname,
  ADD COLUMN phone         VARCHAR(20)  NOT NULL DEFAULT '' COMMENT '手机号' AFTER gender,
  ADD COLUMN email         VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '邮箱' AFTER phone,
  ADD COLUMN target_school VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '目标院校' AFTER email,
  ADD COLUMN bio           VARCHAR(200) NOT NULL DEFAULT '' COMMENT '个性签名' AFTER target_school,
  ADD COLUMN avatar        VARCHAR(255) NOT NULL DEFAULT '' COMMENT '头像（预设图标名或图片地址）' AFTER bio;

-- 2. AI 服务管理：生成记录补调用耗时，便于后台监控大模型调用
ALTER TABLE ai_generations
  ADD COLUMN duration_ms INT NULL COMMENT '本次调用耗时（毫秒）' AFTER status;

-- 3. AI 服务管理：运行时配置覆盖项（管理员在后台切换，.env 值为默认）
CREATE TABLE system_settings (
  k          VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '配置键',
  v          TEXT NULL COMMENT '配置值（JSON 或字符串）',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='系统设置（运行时可改配置）';

-- 4. 数据备份：备份记录
CREATE TABLE backups (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  filename    VARCHAR(255) NOT NULL COMMENT '备份文件名（server/backups 下）',
  file_size   BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '文件字节数',
  table_count INT NOT NULL DEFAULT 0 COMMENT '包含表数',
  row_count   INT NOT NULL DEFAULT 0 COMMENT '包含数据行数',
  sha256      CHAR(64) NOT NULL DEFAULT '' COMMENT '文件 SHA-256，校验完整性',
  created_by  INT UNSIGNED NULL COMMENT '操作管理员',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_created (created_at),
  CONSTRAINT fk_bk_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='数据备份记录';
