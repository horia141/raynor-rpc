import { Constructor, MarshallerConstructor, Marshaller } from 'raynor'

export interface ServiceDescriptor {
    name: string;
    methods: Map<string, MethodDescriptor<any>>;
}

export interface MethodDescriptor<T> {
    name: string;
    output?: OutputDescriptor<T>;
    errors?: ErrorDescriptor;
    params: Array<ParamDescriptor<any>>;
}

export interface OutputDescriptor<T> {
    hasOutput: boolean;
    marshaller: Marshaller<T>|null;
}

export interface ErrorDescriptor {
    errorConstructors: Set<Constructor<Error>>;
}

export interface ParamDescriptor<T> {
    index: number;
    marshaller: Marshaller<T>;
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
            marshaller: new marshallerCtor()
        };
    }
}

export function NoOutput(target: any, methodName: string) {
    const service = _ensureServiceDescriptor(target);
    const method = _ensureMethodDescription(service, methodName);

    method.output = {
        hasOutput: false,
        marshaller: null
    };
}

export function Throws(...errorConstructors: Constructor<Error>[]) {
    return function(target: any, methodName: string) {
        const service = _ensureServiceDescriptor(target);
        const method = _ensureMethodDescription(service, methodName);

        method.errors = {
            errorConstructors: new Set<any>(errorConstructors)
        };
    }
}

export function Param<T>(marshallerCtor: MarshallerConstructor<T>) {
    return function(target: any, methodName: string, parameterIndex: number) {
        const service = _ensureServiceDescriptor(target);
        const method = _ensureMethodDescription(service, methodName);

        method.params[parameterIndex] = {
            index: parameterIndex,
            marshaller: new marshallerCtor(),
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
