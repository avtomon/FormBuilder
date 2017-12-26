/**
 *
 * @param {object} formConf - параметры конфигурации
 *
 * @constructor
 */
function FormBuilder(formConf)
{
    let self = this;

    if (!$.isPlainObject(formConf.form) || !formConf.form.action) {
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
    }

    if ($.isArray(formConf.buttons)) {
        self.parseButtons(this.form, formConf.buttons)
    }
}

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
    let self = this;

    fields.forEach(function (field) {
        if (!field.name || !field.type) {
            return;
        }

        let fieldWrapper = $('<div>', field.fieldWrapper).appendTo(self.form),
            label = $(
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
        self.form.find('*[name=' + name + ']').val(value);
    })
};

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