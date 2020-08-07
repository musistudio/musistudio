function getNodeHtml(node) {
    let outer = document.createElement('div');
    outer.appendChild(node);
    return outer.innerHTML;
}


function printer() {
    document.querySelector('.tools').style.display = 'none';
    document.querySelector('.container').className = 'container-printer';
    window.print();
    document.querySelector('.tools').style.display = '';
    document.querySelector('.container-printer').className = 'container';
}


class Handler {
    constructor(config) {
        this.config = config;
        this.keywords = ['熟悉', '了解', '熟练'];
        this.render();
    }

    ifHandler(source) {
        let eles = Array.prototype.slice.call(document.querySelectorAll('*[u-if]'));
        eles.forEach(ele => {
            if (!ele.getAttribute('u-if') || !eval(ele.getAttribute('u-if'))) {
                let outer = document.createElement('div');
                outer.appendChild(ele);
                source = source.replace(outer.innerHTML, '');
            } else {
                let native = getNodeHtml(ele);
                ele.removeAttribute('u-if');
                let outer = getNodeHtml(ele);
                source = source.replace(native, outer);
            }
        })
        return source;
    }

    forHandler(source) {
        let eles = Array.prototype.slice.call(document.querySelectorAll('*[u-for]'));
        let nodes = [];
        let parent = null;
        for (let i = 0; i < eles.length; i++) {
            if (!parent) {
                parent = {
                    el: eles[i],
                    children: [],
                    command: eles[i].getAttribute('u-for'),
                    origin: getNodeHtml(eles[i])
                }
            }
            if (parent.el.contains(eles[i + 1]) && !parent.children.some(child => child.el && child.el.contains(eles[i + 1]))) {
                parent.children.push({ el: eles[i + 1], children: [], command: eles[i + 1].getAttribute('u-for'), origin: getNodeHtml(eles[i + 1]) });
            } else if (parent.children.some(child => child.el && child.el.contains(eles[i + 1]))) {
                let p = parent.children.filter(child => child.el.contains(eles[i + 1]))
                if (p.length) p = p[0];
                p.children.push({ el: eles[i + 1], children: [], command: eles[i + 1].getAttribute('u-for'), origin: getNodeHtml(eles[i + 1]) })
            } else {
                nodes.push(parent);
                if (i < eles.length - 1) {
                    parent = {
                        el: eles[i + 1],
                        children: [],
                        command: eles[i + 1].getAttribute('u-for'),
                        origin: getNodeHtml(eles[i + 1])
                    }
                }
            }
            eles[i].removeAttribute('u-for');
        }
        let visitNode = (node, parent) => {
            let { el, children, command } = node;
            if (command && command.split(' in ').length === 2) {
                let parseValue = command.split(' in ');
                let datas = parent ? eval(parseValue[1].replace(parseValue[1].split('.')[0], 'parent')) : eval(parseValue[1]);
                let parmas = parseValue[0].split(',');
                parmas = parmas.map(parma => parma.trim().replace(')', '').replace('(', ''));
                let template = datas.map((_data, _index) => {
                    window[parmas[0]] = _data;
                    if (parmas.length > 1) window[parmas[1]] = _index;;
                    let source = node.origin;
                    node.children.forEach(child => {
                        source = source.replace(child.origin, visitNode(child, _data));
                    });
                    source = this.templateHandler(source);
                    delete (window[parmas[0]])
                    if (parmas.length > 1) delete (window[parmas[1]])
                    return source;
                })
                return template.join('');
            }
        }
        nodes.forEach(node => {
            node.source = visitNode(node);
            source = source.replace(node.origin, node.source);
        })
        return source;
    }

    templateHandler(source) {
        let templates = source.match(/\{\{[a-zA-Z0-9]+[.]*[a-zA-Z0-9]+[_]*[a-zA-Z0-9]+\}\}/g);
        templates && templates.forEach(template => {
            let value = eval(template.substring(2, template.length - 2));
            if(typeof value === 'object') {
                switch(value.type) {
                    case 'link':
                        let content = `<a href="${value.url}" target="_black">${value.content}</a>`;
                        source = source.replace(template, content);
                        break;
                }
            }else{
                if (value.startsWith('http')) {
                    value = value.split('//')[1];
                }
                source = source.replace(template, value)
            }
        })
        return source;
    }

    keywordsHandler(source) {
        let keywords = ['熟悉', '了解', '熟练'];
        keywords.forEach(keyword => {
            source = source.replace(new RegExp(`${keyword}`, 'g'), `<span class="keywords">${keyword}</span> `);
        })
        return source;
    }

    render() {
        let el = this.config.el;
        let source = el.innerHTML;
        source = this.ifHandler(source);
        el.innerHTML = source;
        source = this.forHandler(source);
        source = this.templateHandler(source);
        source = this.keywordsHandler(source);
        el.innerHTML = source;
    }
}