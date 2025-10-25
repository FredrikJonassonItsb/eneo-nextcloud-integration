<script lang="ts">
	import { onMount } from 'svelte';

	let message = '';
	let messages: Array<{ role: string; content: string }> = [];
	let loading = false;
	let user: any = null;

	const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost/eneo/api';

	onMount(async () => {
		// Check if user is authenticated
		try {
			const response = await fetch(`${API_URL}/auth/me`, {
				credentials: 'include'
			});
			if (response.ok) {
				user = await response.json();
			}
		} catch (error) {
			console.error('Failed to get user info:', error);
		}
	});

	async function sendMessage() {
		if (!message.trim()) return;

		const userMessage = message;
		message = '';
		messages = [...messages, { role: 'user', content: userMessage }];
		loading = true;

		try {
			const response = await fetch(`${API_URL}/chat/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					message: userMessage
				})
			});

			if (response.ok) {
				const data = await response.json();
				messages = [...messages, { role: 'assistant', content: data.message }];
			} else {
				messages = [
					...messages,
					{ role: 'assistant', content: 'Ett fel uppstod. Försök igen.' }
				];
			}
		} catch (error) {
			console.error('Error sending message:', error);
			messages = [
				...messages,
				{ role: 'assistant', content: 'Kunde inte ansluta till servern.' }
			];
		} finally {
			loading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function login() {
		window.location.href = `${API_URL}/auth/login`;
	}
</script>

<svelte:head>
	<title>Eneo - AI-assistent för Sundsvalls kommun</title>
</svelte:head>

<div class="app">
	<header>
		<div class="header-content">
			<h1>🤖 Eneo</h1>
			<p>AI-assistent för Sundsvalls kommun</p>
			{#if user}
				<div class="user-info">
					<span>Inloggad som: {user.display_name || user.email}</span>
				</div>
			{/if}
		</div>
	</header>

	<main>
		{#if !user}
			<div class="login-prompt">
				<h2>Välkommen till Eneo</h2>
				<p>Logga in med ditt Nextcloud-konto för att komma igång.</p>
				<button class="login-button" on:click={login}>Logga in med Nextcloud</button>
			</div>
		{:else}
			<div class="chat-container">
				<div class="messages">
					{#if messages.length === 0}
						<div class="welcome-message">
							<h2>Hej! Hur kan jag hjälpa dig idag?</h2>
							<p>Jag kan hjälpa dig med:</p>
							<ul>
								<li>Söka i dina dokument i Nextcloud</li>
								<li>Besvara frågor om kommunala policys och dokument</li>
								<li>Sammanfatta långa dokument</li>
								<li>Generera text baserat på dina instruktioner</li>
							</ul>
						</div>
					{/if}

					{#each messages as msg}
						<div class="message {msg.role}">
							<div class="message-content">
								{msg.content}
							</div>
						</div>
					{/each}

					{#if loading}
						<div class="message assistant">
							<div class="message-content">
								<div class="typing-indicator">
									<span></span>
									<span></span>
									<span></span>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<div class="input-container">
					<textarea
						bind:value={message}
						on:keypress={handleKeyPress}
						placeholder="Skriv ditt meddelande här..."
						rows="3"
						disabled={loading}
					></textarea>
					<button on:click={sendMessage} disabled={loading || !message.trim()}>
						Skicka
					</button>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
		background: #f5f5f5;
	}

	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1.5rem 2rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.header-content h1 {
		margin: 0;
		font-size: 2rem;
	}

	.header-content p {
		margin: 0.5rem 0 0 0;
		opacity: 0.9;
	}

	.user-info {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		opacity: 0.8;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.login-prompt {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
	}

	.login-button {
		margin-top: 2rem;
		padding: 1rem 2rem;
		font-size: 1.1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.login-button:hover {
		transform: translateY(-2px);
	}

	.chat-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
		padding: 2rem;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
		margin-bottom: 1rem;
	}

	.welcome-message {
		padding: 2rem;
		text-align: center;
	}

	.welcome-message h2 {
		color: #667eea;
		margin-bottom: 1rem;
	}

	.welcome-message ul {
		text-align: left;
		max-width: 500px;
		margin: 1rem auto;
	}

	.message {
		margin-bottom: 1rem;
		display: flex;
	}

	.message.user {
		justify-content: flex-end;
	}

	.message-content {
		max-width: 70%;
		padding: 1rem;
		border-radius: 12px;
		line-height: 1.5;
	}

	.message.user .message-content {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.message.assistant .message-content {
		background: #f0f0f0;
		color: #333;
	}

	.typing-indicator {
		display: flex;
		gap: 4px;
	}

	.typing-indicator span {
		width: 8px;
		height: 8px;
		background: #999;
		border-radius: 50%;
		animation: typing 1.4s infinite;
	}

	.typing-indicator span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.typing-indicator span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes typing {
		0%,
		60%,
		100% {
			transform: translateY(0);
		}
		30% {
			transform: translateY(-10px);
		}
	}

	.input-container {
		display: flex;
		gap: 1rem;
		background: white;
		padding: 1rem;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
	}

	textarea {
		flex: 1;
		padding: 1rem;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-family: inherit;
		font-size: 1rem;
		resize: none;
		transition: border-color 0.2s;
	}

	textarea:focus {
		outline: none;
		border-color: #667eea;
	}

	button {
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: transform 0.2s;
	}

	button:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

