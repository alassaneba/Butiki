export const FILE_NAME = 'butik_backup.json';

export const getBackupFileId = async (accessToken) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'&fields=files(id)`, 
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

export const uploadToDrive = async (accessToken, jsonData) => {
  const fileId = await getBackupFileId(accessToken);
  
  const metadata = {
    name: FILE_NAME,
    mimeType: 'application/json'
  };
  
  if (!fileId) {
    metadata.parents = ['appDataFolder'];
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([jsonData], { type: 'application/json' }));

  const url = fileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart` 
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    
  const method = fileId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form
  });

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || "Erreur d'envoi vers Google Drive");
  }
  
  return await res.json();
}

export const downloadFromDrive = async (accessToken) => {
  const fileId = await getBackupFileId(accessToken);
  if (!fileId) throw new Error("Aucune sauvegarde distante trouvée sur ce compte.");

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, 
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  
  if (!response.ok) {
    throw new Error("Erreur lors du téléchargement de la sauvegarde.");
  }
  
  return await response.text();
}
