import { Alert, type AlertButton } from 'react-native';

import { confirmDestructive } from '../confirm-destructive';

const options = {
  title: 'Usunąć?',
  message: 'Na pewno?',
  confirmLabel: 'Usuń',
  cancelLabel: 'Anuluj',
};

describe('confirmDestructive (native)', () => {
  afterEach(() => jest.restoreAllMocks());

  const pressButton = (style: AlertButton['style']) =>
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((b) => b.style === style)?.onPress?.();
    });

  it('resolves true on the destructive button', async () => {
    const spy = pressButton('destructive');
    await expect(confirmDestructive(options)).resolves.toBe(true);
    expect(spy).toHaveBeenCalledWith('Usunąć?', 'Na pewno?', expect.any(Array), expect.any(Object));
  });

  it('resolves false on cancel', async () => {
    pressButton('cancel');
    await expect(confirmDestructive(options)).resolves.toBe(false);
  });
});
