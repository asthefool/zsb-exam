-- 专升本智能备考系统数据库初始化脚本（MySQL 8.0+）
-- 用法：mysql -u root -p --default-character-set=utf8mb4 < sql/init.sql
-- 管理员账号由 scripts/init-admin.js 在首次部署时生成（交互式输入密码并 bcrypt 哈希），
-- 不在 SQL 中内置弱口令；示例题目由 scripts/import-questions.js 从 seed-questions.json 导入。
-- 仅用于全新安装；表已存在时请先 DROP DATABASE zsb_exam 或手工清理后重跑。
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS zsb_exam DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zsb_exam;

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(32)  NOT NULL COMMENT '登录账号，唯一',
  password_hash VARCHAR(100) NOT NULL COMMENT 'bcrypt 哈希',
  nickname      VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '昵称',
  gender        ENUM('secret','male','female') NOT NULL DEFAULT 'secret' COMMENT '性别：保密/男/女',
  phone         VARCHAR(20)  NOT NULL DEFAULT '' COMMENT '手机号',
  email         VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '邮箱',
  target_school VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '目标院校',
  bio           VARCHAR(200) NOT NULL DEFAULT '' COMMENT '个性签名',
  avatar        VARCHAR(255) NOT NULL DEFAULT '' COMMENT '头像（预设图标名或图片地址）',
  role          ENUM('student','admin') NOT NULL DEFAULT 'student' COMMENT '角色',
  status        TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0禁用',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_username (username)
) ENGINE=InnoDB COMMENT='用户（考生与管理员）';

CREATE TABLE subjects (
  id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(32) NOT NULL COMMENT '科目名',
  sort INT NOT NULL DEFAULT 0 COMMENT '排序',
  UNIQUE KEY uk_name (name)
) ENGINE=InnoDB COMMENT='科目字典';

CREATE TABLE questions (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_id INT UNSIGNED NOT NULL COMMENT '科目',
  q_type     ENUM('single','multiple','judge') NOT NULL DEFAULT 'single' COMMENT '题型',
  content    TEXT NOT NULL COMMENT '题干',
  options    JSON NULL COMMENT '选项数组，判断题为空',
  answer     VARCHAR(32) NOT NULL COMMENT '正确答案，如 A、ABD、true',
  analysis   TEXT NULL COMMENT '解析',
  difficulty TINYINT NOT NULL DEFAULT 2 COMMENT '难度 1-5',
  status     TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  deleted_at DATETIME NULL COMMENT '软删除时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '题目修改时间，讲解缓存版本依据',
  KEY idx_subject_status (subject_id, status),
  KEY idx_type (q_type),
  CONSTRAINT fk_q_subject FOREIGN KEY (subject_id) REFERENCES subjects(id)
) ENGINE=InnoDB COMMENT='题库题目';

CREATE TABLE answer_records (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL COMMENT '作答用户',
  question_id INT UNSIGNED NOT NULL COMMENT '题目',
  user_answer VARCHAR(32) NOT NULL COMMENT '考生答案',
  is_correct  TINYINT NOT NULL COMMENT '1对 0错',
  source      ENUM('practice','wrong_redo','plan_task') NOT NULL DEFAULT 'practice' COMMENT '作答来源',
  answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user_time (user_id, answered_at),
  KEY idx_question (question_id),
  CONSTRAINT fk_ar_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_ar_question FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB COMMENT='答题记录';

CREATE TABLE wrong_questions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL COMMENT '用户',
  question_id   INT UNSIGNED NOT NULL COMMENT '题目',
  wrong_count   INT NOT NULL DEFAULT 1 COMMENT '累计错误次数',
  last_wrong_at DATETIME NOT NULL COMMENT '最近错误时间',
  mastered      TINYINT NOT NULL DEFAULT 0 COMMENT '是否已掌握',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_question (user_id, question_id),
  KEY idx_user_mastered (user_id, mastered),
  CONSTRAINT fk_wq_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_wq_question FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB COMMENT='个人错题本';

CREATE TABLE review_plans (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL COMMENT '用户',
  exam_date        DATE NULL COMMENT '考试日期',
  target_subjects  VARCHAR(255) NULL COMMENT '目标科目id，逗号分隔',
  daily_minutes    INT NULL COMMENT '每日计划学习时长',
  status           ENUM('active','archived','finished') NOT NULL DEFAULT 'active' COMMENT '同用户仅一个 active',
  ai_generation_id BIGINT UNSIGNED NULL COMMENT '关联 AI 生成记录',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user_status (user_id, status),
  CONSTRAINT fk_rp_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='复习计划主体';

CREATE TABLE plan_tasks (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plan_id          INT UNSIGNED NOT NULL COMMENT '所属计划',
  task_date        DATE NOT NULL COMMENT '任务日期',
  time_slot        VARCHAR(16) NOT NULL DEFAULT '' COMMENT '时段',
  content          VARCHAR(500) NOT NULL COMMENT '任务内容',
  ref_question_ids JSON NULL COMMENT '错题重练关联题目id',
  status           ENUM('pending','done') NOT NULL DEFAULT 'pending' COMMENT '打卡状态',
  done_at          DATETIME NULL COMMENT '打卡时间',
  KEY idx_plan_date (plan_id, task_date),
  CONSTRAINT fk_pt_plan FOREIGN KEY (plan_id) REFERENCES review_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='计划任务与打卡';

CREATE TABLE ai_generations (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL COMMENT '用户',
  gen_type         ENUM('explain','plan') NOT NULL COMMENT '功能类型',
  ref_type         VARCHAR(32) NOT NULL DEFAULT 'wrong_question' COMMENT '关联对象类型',
  ref_id           BIGINT UNSIGNED NOT NULL COMMENT '关联对象id',
  question_version DATETIME NULL COMMENT '生成时题目 updated_at 快照',
  provider         VARCHAR(32) NOT NULL COMMENT 'mock 或模型名',
  prompt           MEDIUMTEXT NULL COMMENT '实际提示词，审计用',
  content          MEDIUMTEXT NOT NULL COMMENT '生成内容',
  status           ENUM('success','failed') NOT NULL DEFAULT 'success',
  duration_ms      INT NULL COMMENT '本次调用耗时（毫秒）',
  error_msg        VARCHAR(255) NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ref (gen_type, ref_type, ref_id),
  KEY idx_user_type (user_id, gen_type),
  CONSTRAINT fk_ag_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='AI 生成记录与缓存';

CREATE TABLE system_settings (
  k          VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '配置键',
  v          TEXT NULL COMMENT '配置值（JSON 或字符串）',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='系统设置（运行时可改配置）';

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

-- 种子数据：科目字典（题目由导题脚本灌入，保持初始规模可配置）
INSERT INTO subjects (name, sort) VALUES
 ('大学英语', 1), ('高等数学', 2), ('计算机基础', 3), ('管理学', 4);
