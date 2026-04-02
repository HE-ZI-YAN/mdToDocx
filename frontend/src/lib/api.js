async function handleResponse(response) {
  if (!response.ok) {
    let message = "请求失败";
    try {
      const payload = await response.json();
      message = payload.message || payload.detail || message;
    } catch {
      // noop
    }

    throw new Error(message);
  }

  return response;
}

export async function uploadMarkdownFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData
  });

  await handleResponse(response);
  return response.json();
}

export async function fetchTemplates() {
  const response = await fetch("/api/templates");
  await handleResponse(response);
  return response.json();
}

export async function saveTemplate(payload) {
  const response = await fetch("/api/templates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  await handleResponse(response);
  return response.json();
}

export async function convertMarkdownToDocx(payload) {
  const response = await fetch("/api/convert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  await handleResponse(response);
  return response.blob();
}
