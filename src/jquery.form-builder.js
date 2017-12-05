$(function () {
    function FormBuilder(formConf)
    {
        let self = this;

        if (!formConf.form.action) {
            throw new Error('Не задан урл для отправки формы');
        }

        if (!formConf.title.html || !formConf.title.text) {
            throw new Error('Не задан заголовок формы');
        }

        self.formParent = $(
            '<div>', {
                id: 'formParent',
            }
        );

        self.title = $('<div>', formConf.title).appendTo(self.formParent);

        self.menu = $('<menu>').appendTo(self.formParent);

        self.form = $(
            '<form>',
            $.extend(formConf.form, {method: 'POST'})
        ).appendTo(self.formParent);

        if (formConf.sections && $.isArray(formConf.sections)) {
            self.parseSections(formConf.sections);
        } else if (formConf.fields && $.isArray(formConf.fields)) {
            self.parseFields(formConf.fields)
        }

        if (formConf.buttons && $.isArray(formConf.buttons)) {
            self.parseButtons(formConf.buttons)
        }
    }

    FormBuilder.prototype.parseButtons = function (buttons)
    {
        let self = this;

        buttons.forEach(function (button) {
            if (!button.text || !button.type) {
                return;
            }

            self.form.append($('<button>', button));
        });
    };

    FormBuilder.prototype.parseSections = function (sections)
    {
        let self = this;

        sections.forEach(function (section) {
            if (!section.id || !$.isArray(section.fields)) {
                return;
            }

            $('<li>', section)
                .appendTo(self.formParent)
                .click(function () {
                    self.form.children('.' + section.id).show().siblings().hide();
                });

            let formSection = $('<section>', {
                class: section.id
            }).appendTo(self.form);

            self.parseFields(formSection, section.fields)
        });
    };

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
                        text: field.title || field.name,
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

            if (field.labelAfter)
                fieldEl.prependTo(fieldWrapper);
            else {
                fieldEl.appendTo(fieldWrapper);
            }
        });
    };

    FormBuilder.prototype.getFormParent = function ()
    {
        return this.formParent;
    };


    FormBuilder.prototype.setFormValues = function (valuesObject)  {
        let self = this;

        if (!$.isPlainObject(valuesObject)) {
            throw new Error('Значения формы должны быть задана объектом с парами <имя элемента формы>: <значение>');
        }

        $.each(valuesObject, function (name, value) {
            self.form.find('*[name=' + name + ']').val(value);
        })
    };
});


