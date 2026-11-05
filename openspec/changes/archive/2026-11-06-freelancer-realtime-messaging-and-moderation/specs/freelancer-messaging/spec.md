## ADDED Requirements

### Requirement: Starting conversations
Only active members SHALL be allowed to initiate a new conversation with an approved freelancer. Freelancers cannot initiate conversations with clients. The system MUST enforce a daily limit of 20 new conversations per member.

#### Scenario: Active member starts conversation
- **WHEN** a client with an active membership initiates a conversation with an approved freelancer
- **THEN** a conversation thread is created or the existing thread is returned

#### Scenario: Non-member starts conversation
- **WHEN** a client without active membership attempts to start a conversation
- **THEN** the request is rejected with 403 and code MEMBERSHIP_REQUIRED

#### Scenario: Rate limit exceeded
- **WHEN** an active member exceeds 20 new conversations in a single day
- **THEN** the request is rejected with 429 Too Many Requests

### Requirement: Message transmission and membership policy
Active members and assigned freelancers SHALL send messages within open conversations. If a member's plan expires, their new message sends MUST be rejected, but the freelancer MUST always be allowed to reply.

#### Scenario: Member sends message
- **WHEN** an active member sends a message under 2000 characters
- **THEN** the message is saved to the database and emitted over WebSocket to the freelancer

#### Scenario: Expired member sends message
- **WHEN** a client whose membership has expired attempts to send a message
- **THEN** the message is rejected with 403 Forbidden

#### Scenario: Freelancer replies to expired member
- **WHEN** a freelancer sends a reply in an existing conversation to an expired member
- **THEN** the message is accepted and saved

### Requirement: Automated content moderation
The system SHALL scan all message text for prohibited terms, phone numbers, and URLs. Bad words MUST result in immediate message rejection. Phone numbers and links MUST be accepted but flagged.

#### Scenario: Message contains prohibited terms
- **WHEN** a sender includes a word matching an active FilterTerm or profanity list
- **THEN** the message is rejected with 400 Bad Request and not saved

#### Scenario: Message contains phone or link
- **WHEN** a member sends a message containing an external link or phone number
- **THEN** the message is delivered with PHONE or LINK flags, and the web client displays links as unclickable plain text

#### Scenario: Repeated flag rate limit
- **WHEN** a user triggers 3 content flags in 24 hours
- **THEN** the user is rate-limited from sending messages for 1 hour

### Requirement: Real-time socket delivery and notifications
The WebSocket gateway SHALL deliver incoming messages in real time to connected users in their private user room. If the recipient is offline, the system MUST create a notification.

#### Scenario: Recipient online
- **WHEN** a message is sent to a recipient with an active WebSocket connection
- **THEN** a message:new event is delivered within 1 second

#### Scenario: Recipient offline
- **WHEN** a message is sent to an offline recipient
- **THEN** a notification of type MESSAGE_NEW is created for the recipient

### Requirement: Conversation management and read receipts
Participants SHALL view conversation lists with unread counters, mark threads as read, and retrieve message history.

#### Scenario: Read receipt update
- **WHEN** a recipient marks a conversation as read
- **THEN** unread count is reset to 0 and readAt timestamp is set on received messages

#### Scenario: Unauthorized conversation access
- **WHEN** a user attempts to read messages of a conversation they do not belong to
- **THEN** the request is rejected with 403 Forbidden

### Requirement: Safety controls: reporting and blocking
A participant SHALL be able to report inappropriate conversations and block abusive users. Blocked users MUST NOT be able to send messages to the blocker.

#### Scenario: User blocks another user
- **WHEN** user A blocks user B
- **THEN** a UserBlock record is created and any future message attempts from B to A are rejected

#### Scenario: User reports conversation
- **WHEN** a participant reports a conversation with a reason
- **THEN** a MessageReport is saved with PENDING status for admin review
