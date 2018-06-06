import { Constructor, Marshaller } from 'raynor'

// A single point-of-truth class/object which depends on a bunch of entities annotated with Raynor
// Ultimately this can be just a JSON. But it's a bad way to specify things, so something looking
// like a class would be the best.

export async function nop<T>(..._args: any[]): Promise<T> {
    throw new Error('Cannot invoke this function directly');
}

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
