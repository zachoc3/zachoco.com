"use strict";

// Submits the contact form in the background so visitors stay on the page.
// Without JavaScript the form still posts to Web3Forms, which redirects back with ?contact=sent.
(function () {
	const form = document.getElementById("contact-form");
	const submit = document.getElementById("contact-submit");
	const success = document.getElementById("contact-success");
	const error = document.getElementById("contact-error");
	if (!form || !submit) return;

	function show(type) {
		success.hidden = type !== "success";
		error.hidden = type !== "error";
	}

	if (new URLSearchParams(location.search).get("contact") === "sent") {
		show("success");
		history.replaceState(null, "", location.pathname + "#contact");
	}

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		show(null);
		submit.disabled = true;
		submit.textContent = "Sending…";

		try {
			const response = await fetch(form.action, {
				method: "POST",
				body: new FormData(form),
				headers: { Accept: "application/json" },
			});
			const result = await response.json();
			if (!result.success) throw new Error(result.message);
			form.reset();
			show("success");
		} catch {
			show("error");
		} finally {
			submit.disabled = false;
			submit.textContent = "Send message";
		}
	});
})();
