-- Insert data into accounts
INSERT INTO accounts (account_id, phone, password, is_active) VALUES
(1, '+1234567890', 'hashed_pass_1', true),
(2, '+0987654321', 'hashed_pass_2', true),
(3, '+1122334455', 'hashed_pass_3', false);

-- Insert data into users
INSERT INTO users (user_id, full_name, email, avatar, dob, gender, bio) VALUES
(1, 'Alice Smith', 'alice@example.com', 'alice.jpg', '1990-05-15', 'FEMALE', 'Loves hiking and coding'),
(2, 'Bob Johnson', 'bob@example.com', 'bob.jpg', '1985-08-22', 'MALE', 'Tech enthusiast'),
(3, 'Carol Brown', 'carol@example.com', 'carol.jpg', '1995-03-10', 'FEMALE', 'Aspiring artist');

-- Insert data into contacts
INSERT INTO contacts (user_id, contact_id) VALUES
(1, 2),
(2, 1),
(1, 3);

-- Insert data into user_blocked
INSERT INTO user_blocked (blocker_id, blocked_id) VALUES
(2, 3);

-- Insert data into chats
INSERT INTO chats (chat_id, type, chat_name, cover_image) VALUES
(1, 'PRIVATE', 'Alice-Bob Chat', 'default_cover.jpg'),
(2, 'GROUP', 'Friends Group', 'group_cover.jpg'),
(3, 'CHANNEL', 'Tech Updates', 'tech_cover.jpg');

-- Insert data into chat_members
INSERT INTO chat_members (chat_id, member_id, is_owner, joined_at) VALUES
(1, 1, true, '2025-01-01'),
(1, 2, false, '2025-01-01'),
(2, 1, true, '2025-02-01'),
(2, 2, false, '2025-02-01'),
(2, 3, false, '2025-02-02'),
(3, 2, true, '2025-03-01');

-- Insert data into messages
INSERT INTO messages (message_id, chat_id, sender_id, content, created_at, is_edited, is_deleted, reply_to) VALUES
(1, 1, 1, 'Hey Bob, how''s it going?', '2025-06-01 10:00:00', false, false, NULL),
(2, 1, 2, 'All good, Alice! You?', '2025-06-01 10:05:00', false, false, 1),
(3, 2, 3, 'Group party this weekend?', '2025-06-02 12:00:00', true, false, NULL),
(4, 3, 2, 'New tech article posted!', '2025-06-03 15:00:00', false, false, NULL);

-- Insert data into message_status
INSERT INTO message_status (message_id, member_id, status) VALUES
(1, 2, 'READ'),
(2, 1, 'UNREAD'),
(3, 1, 'READ'),
(3, 2, 'UNREAD');

-- Insert data into message_reactions
INSERT INTO message_reactions (user_id, message_id, type) VALUES
(2, 1, 'LIKE'),
(1, 3, 'LOVE'),
(3, 4, 'WOW');

-- Insert data into attachments
INSERT INTO attachments (attachment_id, message_id, url, type) VALUES
(1, 3, 'party_invite.pdf', 'FILE'),
(2, 4, 'tech_article.jpg', 'IMAGE'),
(3, 4, 'tech_video.mp4', 'VIDEO');