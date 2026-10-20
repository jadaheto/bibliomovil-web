import { AlertService } from './alert.service';

describe('AlertService', () => {
  it('conserva el mensaje una navegación y lo limpia en la siguiente', () => {
    const service = new AlertService();
    service.error('Credenciales inválidas');
    expect(service.messages()).toHaveLength(1);
    service.onNavigation();
    expect(service.messages()).toHaveLength(1);
    service.onNavigation();
    expect(service.messages()).toHaveLength(0);
  });

  it('no duplica el mismo texto y permite descartar', () => {
    const service = new AlertService();
    service.success('Guardado');
    service.success('Guardado');
    expect(service.messages()).toHaveLength(1);
    service.dismiss(service.messages()[0].id);
    expect(service.messages()).toHaveLength(0);
  });
});
