/**
 *
 * @param {object} formConf - параметры конфигурации
 *
 * @constructor
 */
function FormBuilder(formConf)
{
    let self = this;

    if (!$.isPlainObject(formConf.form)) {
        throw new Error('Не задана конфигурация формы');
    }

    if (!formConf.form.action) {
        throw new Error('Не задан урл для отправки формы');
    }

    if (!$.isPlainObject(formConf.title) || (!formConf.title.html && !formConf.title.text)) {
        throw new Error('Не задан заголовок формы');
    }

    self.formConf = formConf;

    self.formParent = $(
        '<div>', {
            id: 'formParent',
        }
    );

    self.title = $('<div>', formConf.title).appendTo(self.formParent);

    self.form = $(
        '<form>',
        $.extend({}, diff(formConf.form, {fields: '', labelafter: ''}), {method: 'POST'})
    ).appendTo(self.formParent);

    if ($.isArray(formConf.sections)) {
        self.parseSections(formConf.sections);
    } else if ($.isArray(formConf.fields)) {
        self.parseFields(this.form, formConf.fields)
        if ($.isArray(formConf.buttons)) {
            self.parseButtons(this.form, formConf.buttons)
        }
    }

    if (formConf.stopImageClass) {
        self.stopImageClass = formConf.stopImageClass;
    }
}

FormBuilder.prototype.stopImageClass = 'no-image';

/**
 * Добавить кнопки, заданные в конфигурации к форме
 *
 * @param {jQuery} section - в какой раздел вставляем
 * @param {array} buttons - конфигурация кнопок
 */
FormBuilder.prototype.parseButtons = function (section, buttons)
{
    let self = this;

    buttons.forEach(function (button) {
        button.type = button.type || 'button';
        section.append($('<button>', button));
    });
};

/**
 * Добавить разделы полей и их поля к форме
 *
 * @param {array} sections - массив разделов
 */
FormBuilder.prototype.parseSections = function (sections)
{
    let self = this;

    self.menu = $('<menu>');
    self.title.after(self.menu);
    sections.forEach(function (section) {
        if (!section.id || !$.isArray(section.fields)) {
            return;
        }

        let formSection = $('<section>', {id: section.id}).appendTo(self.form);

        section.href = '#' + section.id;
        $('<a>', diff(section, {fields: '', buttons: ''})).appendTo(self.menu);

        self.parseFields(formSection, section.fields)

        if ($.isArray(section.buttons)) {
            self.parseButtons(formSection, section.buttons)
        }
    });

    if (self.formConf.invisibleClass && self.formConf.currentClass) {
        let visibleNumber = self.formConf.currentNumber || 0;
        self.form.find('section').eq(visibleNumber).siblings('section').addClass(self.formConf.invisibleClass);
        self.menu.find('a').eq(visibleNumber).addClass(self.formConf.currentClass);
    }
};

/**
 * Добавить поля к форме
 *
 * @param {jQuery} section - в какой раздел вставляем
 * @param {array} fields - поля
 */
FormBuilder.prototype.parseFields = function (section, fields)
{
    let self = this,
        fieldEl;

    fields.forEach(function (field) {
        if (!field.name || !field.type) {
            return;
        }

        if (field.fieldWrapper)
        {
            let fieldWrapper = $('<div>', field.fieldWrapper).appendTo(self.form);
        } else {
            let fieldWrapper = section;
        }

        if (self.formConf.templatePath && field.template) {
            let path = self.formConf.templatePath + field.template;
            if (self.formConf.templateServerPart) {
                path.replace(self.formConf.templateServerPart, '')
            }

            $.get(path, function (template) {
                fieldEl = template;
                fieldEl.find('label').text(field.html || field.text);
                fieldEl.find('input, select, textarea').attr('class', field.class);
            });
        } else {
            let label = $(
                '<label>',
                {
                    text: field.html || field.text || field.name,
                    for: field.id || field.name
                }).appendTo(fieldWrapper),
                fieldEl;

            delete field.title;

            switch (field.type) {
                case 'select':
                    delete field.type;
                    fieldEl = $(
                        '<select>',
                        field
                    );
                    if ($.isArray(field.options)) {
                        field.options.forEach( function (option) {
                            $(
                                '<option>',
                                option
                            ).appendTo(fieldEl);
                        });
                    }
                    break;
                case 'textarea':
                    delete field.type;
                    fieldEl = $(
                        '<textarea>',
                        field
                    );
                    break;
                default:
                    fieldEl = $(
                        '<input>',
                        field
                    );
            }
        }

        if (self.formConf.labelAfter)
            fieldEl.prependTo(fieldWrapper);
        else {
            fieldEl.appendTo(fieldWrapper);
        }

        fieldWrapper.appendTo(section);
    });
};

/**
 * Заполняить поля форма значениями
 *
 * @param {object} valuesObject - массив значений в формате <имя поля> => <значение>
 */
FormBuilder.prototype.setFormValues = function (valuesObject)
{
    let self = this;

    if (!$.isPlainObject(valuesObject)) {
        throw new Error('Значения формы должны быть задана объектом с парами <имя элемента формы>: <значение>');
    }

    $.each(valuesObject, function (name, value) {
        this.setInputValue(name, value);
        this.setImageValue(name, value);
    })
};

/**
 * Вставка значения элемента формы
 *
 * @param {string} name - имя элемента формы
 * @param value - значение
 *
 * @returns {JQuery<TElement extends Node> | * | jQuery | HTMLElement}
 */
FormBuilder.prototype.setInputValue = function (name, value)
{
    let self = this,
        element = this.form.find("[name=" + name + "]")
    if (!element) {
        return;
    }

    if (!this.selectTextFieldName || !this.selectValueFieldName) {
        throw new Error('В конфигурации не заданы имена полей для получения значений и тектов выпадающего списка');
    }

    if ($.isArray(value) && element.is('select')) {
        this.setSelectOptions(element, value, value);
    } else {
        element.val(value);
    }

    return element;
}

/**
 * Вставка изображений
 *
 * @param {string} name - имя элемента для отображения картинки
 * @param value - изображение или массив изображений
 *
 * @returns {JQuery<TElement extends Node> | * | jQuery | HTMLElement}
 */
FormBuilder.prototype.setImageValue = function (name, value)
{
    let element = this.form.find("img[data-view=" + name + "]");
    if (!element.length) {
        return;
    }

    if (!$.isArray(value)) {
        value = [value];
    }

    element.removeClass(this.stopImageClass);
    let lastIndex = count(value) - 1;
    value.forEach(function (imgSrc, index) {
        element
            .attr('src', imgSrc)
            .after(
                $('<input>')
                    .attr('type', 'hidden')
                    .attr('name', name)
                    .val(imgSrc)
            );

        if (index < lastIndex) {
            let newElement = element.clone(true);
            element.after(newElement);
            element = newElement;
        }
    });

    return element;
}

/**
 * Добавить опции для выпадающего списка
 *
 * @param {string|jQuery} select - элемент списка или имя обрабатываемого списка
 * @param {array} options - массив данных об опциях
 * @param {bool} addEmpty - добвалять ли в начало пустой элемент
 *
 * @returns {JQuery<TElement extends Node> | * | jQuery | HTMLElement}
 */
FormBuilder.prototype.setSelectOptions = function (select, options, addEmpty = true)
{
    if (select instanceof 'String') {
        select = this.form.find("[name=$select]");
        if (!select.length) {
            return;
        }
    }

    if (!options[0]) {
        return;
    }

    if (addEmpty) {
        var emptyOption = Object.assign({}, options[0]);
        emptyOption.value = null;
        emptyOption.text = emptyOption.html = '';
        options.unshift(emptyOption);
    }

    options.forEach(function (option) {
        if (!option.text && !option.html) {
            option.text = option.value;
        }

        $('<option>', option).appendTo(select)
    });

    return select;
}

/**
 * Установить параметр action формы
 *
 * @param {string} newAction
 */
FormBuilder.prototype.setFormAction = function (newAction)
{
    this.form.attr('action', newAction);
}

/**
 * Вернуть форму
 *
 * @returns {JQuery<TElement extends Node> | * | jQuery | HTMLElement}
 */
FormBuilder.prototype.getFormParent = function ()
{
    return this.formParent;
};

/**
 * Вернуть конфиг формы
 *
 * @returns {Object|*}
 */
FormBuilder.prototype.getFormConf = function ()
{
    return this.formConf;
};