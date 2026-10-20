/** Configuración de producción. `apiUrl` se sustituye en el build de Docker (ver Dockerfile). */
export const environment = {
  production: true,
  apiUrl: '__API_URL__',
  appName: 'Biblio Móvil',
};
