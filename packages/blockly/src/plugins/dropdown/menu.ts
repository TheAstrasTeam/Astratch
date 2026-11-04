import * as Blockly from 'blockly';

export class AshMenu extends Blockly.FieldDropdown {
    private searchContent: string = '';

    constructor(
        menuGenerator: Blockly.MenuGenerator,
        validator?: Blockly.FieldDropdownValidator,
        config?: Blockly.FieldDropdownConfig,
    ) {
        super(menuGenerator, validator, config);
    }

    protected override showEditor_(e?: MouseEvent): void {
        super.showEditor_(e);
        const searchInput = document.createElement('input');
        searchInput.classList.add('ash-dropdown-searchInput');
        searchInput.type = 'search';

        searchInput.oninput = e => {
            this.searchContent = (e.target as HTMLInputElement)?.value ?? '';
            const elements = this.menu_?.getElement();
            if (!elements) return;
            const options = this.getOptions(true);
            /** 获取它的文本/值和其的div */
            const targets = Array.from(elements.getElementsByClassName('blocklyMenuItem')).map(
                menu => {
                    const text = menu.querySelector('.blocklyMenuItemContent')?.textContent ?? '';
                    const value = options.find(option => option[0] === text)?.[1];

                    return {
                        dom: menu,
                        text,
                        value,
                    };
                },
            );
            targets.forEach(target => {
                const isVisible =
                    target.text
                        .toLocaleLowerCase()
                        .includes(this.searchContent.toLocaleLowerCase()) ||
                    target.value
                        ?.toLocaleLowerCase()
                        .includes(this.searchContent.toLocaleLowerCase()) ||
                    !this.searchContent;

                if (!target.dom) return;

                if (isVisible) (target.dom as HTMLDivElement).classList.remove('unMatch');
                else (target.dom as HTMLDivElement).classList.add('unMatch');
            });
        };

        if (!this.menu_) return;
        const dropdownDiv = Blockly.DropDownDiv.getContentDiv();
        dropdownDiv.prepend(searchInput);
        searchInput.focus();

        dropdownDiv.style.height = `${this.menu_.getSize().height + searchInput.getBoundingClientRect().height + 5}px`;
        dropdownDiv.style.display = `flex`;
        dropdownDiv.style.flexDirection = `column`;
        dropdownDiv.style.gap = '5px';
    }
}
