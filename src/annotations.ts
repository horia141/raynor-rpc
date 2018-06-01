import { MarshallerConstructor } from 'raynor'

interface ServiceDescriptor {
    name: string;
    methods: Map<string, MethodDescriptor<any>>;
}

interface MethodDescriptor<T> {
    name: string;
    output?: OutputDescriptor<T>;
    errors?: ErrorDescriptor;
    params: Array<ParamDescriptor<any>>;
}

interface OutputDescriptor<T> {
    hasOutput: boolean;
    ctor: MarshallerConstructor<T>|null;
}

interface ErrorDescriptor {
    ctors: Set<any>;
}

interface ParamDescriptor<T> {
    index: number;
    ctor: MarshallerConstructor<T>;
    required: boolean;
}

export function Service(target: Function) {
    _ensureServiceDescriptor(target.prototype);

    // Bear with me.
    target.prototype.__service.name = target.name;
}

export function Method() {
    return function(target: any, methodName: string) {
        const service = _ensureServiceDescriptor(target);
        _ensureMethodDescription(service, methodName);
    }
}

export function Output<T>(marshallerCtor: MarshallerConstructor<T>) {
    return function(target: any, methodName: string) {
        const service = _ensureServiceDescriptor(target);
        const method = _ensureMethodDescription(service, methodName);

        method.output = {
            hasOutput: true,
            ctor: marshallerCtor
        };
    }
}

export function NoOutput(target: any, methodName: string) {
    const service = _ensureServiceDescriptor(target);
    const method = _ensureMethodDescription(service, methodName);

    method.output = {
        hasOutput: false,
        ctor: null
    };
}

export function Throws(...errorConstructors: any[]) {
    return function(target: any, methodName: string) {
        const service = _ensureServiceDescriptor(target);
        const method = _ensureMethodDescription(service, methodName);

        method.errors = {
            ctors: new Set<any>(errorConstructors)
        };
    }
}

export function Param<T>(marshallerCtor: MarshallerConstructor<T>) {
    return function(target: any, methodName: string, parameterIndex: number) {
        const service = _ensureServiceDescriptor(target);
        const method = _ensureMethodDescription(service, methodName);

        method.params[parameterIndex] = {
            index: parameterIndex,
            ctor: marshallerCtor,
            required: true
        };
    }
}

function _ensureServiceDescriptor(target: any): ServiceDescriptor {
    if (!(target.hasOwnProperty('__service'))) {
        target.__service = {
            name: target.name,
            methods: new Map<string, MethodDescriptor<any>>()
        };
    }

    return target.__service;
}

function _ensureMethodDescription<T>(service: ServiceDescriptor, methodName: string): MethodDescriptor<T> {
    let method = service.methods.get(methodName);

    if (method == undefined) {
        method = {
            name: methodName,
            params: []
        };
        service.methods.set(methodName, method);
    }

    return method;
}
