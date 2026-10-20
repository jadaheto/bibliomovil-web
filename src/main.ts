import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { aplicarTema, leerTemaGuardado } from './app/core/ui/tema';

// El tema se aplica antes de arrancar para evitar el parpadeo claro → oscuro.
aplicarTema(leerTemaGuardado());

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
