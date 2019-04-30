const addButton = () => {
    const button = document.createElement('input');
    button.type = 'button';
    button.value = '🐛';

    document.body.insertAdjacentElement('afterbegin', button);
};

benchmark('add button', () => {
    run(() => addButton());
});
