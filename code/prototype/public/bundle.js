(function () {
    'use strict';

    var coef = 500;
    var K = 4;
    var nbPR = 2;

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    /** PURE_IMPORTS_START  PURE_IMPORTS_END */
    function isFunction(x) {
        return typeof x === 'function';
    }

    /** PURE_IMPORTS_START  PURE_IMPORTS_END */
    var _enable_super_gross_mode_that_will_cause_bad_things = false;
    var config = {
        Promise: undefined,
        set useDeprecatedSynchronousErrorHandling(value) {
            if (value) {
                var error = /*@__PURE__*/ new Error();
                /*@__PURE__*/ console.warn('DEPRECATED! RxJS was set to use deprecated synchronous error handling behavior by code at: \n' + error.stack);
            }
            _enable_super_gross_mode_that_will_cause_bad_things = value;
        },
        get useDeprecatedSynchronousErrorHandling() {
            return _enable_super_gross_mode_that_will_cause_bad_things;
        },
    };

    /** PURE_IMPORTS_START  PURE_IMPORTS_END */
    function hostReportError(err) {
        setTimeout(function () { throw err; }, 0);
    }

    /** PURE_IMPORTS_START _config,_util_hostReportError PURE_IMPORTS_END */
    var empty = {
        closed: true,
        next: function (value) { },
        error: function (err) {
            if (config.useDeprecatedSynchronousErrorHandling) {
                throw err;
            }
            else {
                hostReportError(err);
            }
        },
        complete: function () { }
    };

    /** PURE_IMPORTS_START  PURE_IMPORTS_END */
    var isArray = /*@__PURE__*/ (function () { return Array.isArray || (function (x) { return x && typeof x.length === 'number'; }); })();

    /** PURE_IMPORTS_START  PURE_IMPORTS_END */
    function isObject(x) {
        return x !== null && typeof x === 'object';
    }

    /** PURE_IMPORTS_START  PURE_IMPORTS_END */
    var UnsubscriptionErrorImpl = /*@__PURE__*/ (function () {
        function UnsubscriptionErrorImpl(errors) {
            Error.call(this);
            this.message = errors ?
                errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ') : '';
            this.name = 'UnsubscriptionError';
            this.errors = errors;
            return this;
        }
        UnsubscriptionErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
        return UnsubscriptionErrorImpl;
    })();
    var UnsubscriptionError = UnsubscriptionErrorImpl;

    /** PURE_IMPORTS_START _util_isArray,_util_isObject,_util_isFunction,_util_UnsubscriptionError PURE_IMPORTS_END */
    var Subscription = /*@__PURE__*/ (function () {
        function Subscription(unsubscribe) {
            this.closed = false;
            this._parentOrParents = null;
            this._subscriptions = null;
            if (unsubscribe) {
                this._unsubscribe = unsubscribe;
            }
        }
        Subscription.prototype.unsubscribe = function () {
            var errors;
            if (this.closed) {
                return;
            }
            var _a = this, _parentOrParents = _a._parentOrParents, _unsubscribe = _a._unsubscribe, _subscriptions = _a._subscriptions;
            this.closed = true;
            this._parentOrParents = null;
            this._subscriptions = null;
            if (_parentOrParents instanceof Subscription) {
                _parentOrParents.remove(this);
            }
            else if (_parentOrParents !== null) {
                for (var index = 0; index < _parentOrParents.length; ++index) {
                    var parent_1 = _parentOrParents[index];
                    parent_1.remove(this);
                }
            }
            if (isFunction(_unsubscribe)) {
                try {
                    _unsubscribe.call(this);
                }
                catch (e) {
                    errors = e instanceof UnsubscriptionError ? flattenUnsubscriptionErrors(e.errors) : [e];
                }
            }
            if (isArray(_subscriptions)) {
                var index = -1;
                var len = _subscriptions.length;
                while (++index < len) {
                    var sub = _subscriptions[index];
                    if (isObject(sub)) {
                        try {
                            sub.unsubscribe();
                        }
                        catch (e) {
                            errors = errors || [];
                            if (e instanceof UnsubscriptionError) {
                                errors = errors.concat(flattenUnsubscriptionErrors(e.errors));
                            }
                            else {
                                errors.push(e);
                            }
                        }
                    }
                }
            }
            if (errors) {
                throw new UnsubscriptionError(errors);
            }
        };
        Subscription.prototype.add = function (teardown) {
            var subscription = teardown;
            if (!teardown) {
                return Subscription.EMPTY;
            }
            switch (typeof teardown) {
                case 'function':
                    subscription = new Subscription(teardown);
                case 'object':
                    if (subscription === this || subscription.closed || typeof subscription.unsubscribe !== 'function') {
                        return subscription;
                    }
                    else if (this.closed) {
                        subscription.unsubscribe();
                        return subscription;
                    }
                    else if (!(subscription instanceof Subscription)) {
                        var tmp = subscription;
                        subscription = new Subscription();
                        subscription._subscriptions = [tmp];
                    }
                    break;
                default: {
                    throw new Error('unrecognized teardown ' + teardown + ' added to Subscription.');
                }
            }
            var _parentOrParents = subscription._parentOrParents;
            if (_parentOrParents === null) {
                subscription._parentOrParents = this;
            }
            else if (_parentOrParents instanceof Subscription) {
                if (_parentOrParents === this) {
                    return subscription;
                }
                subscription._parentOrParents = [_parentOrParents, this];
            }
            else if (_parentOrParents.indexOf(this) === -1) {
                _parentOrParents.push(this);
            }
            else {
                return subscription;
            }
            var subscriptions = this._subscriptions;
            if (subscriptions === null) {
                this._subscriptions = [subscription];
            }
            else {
                subscriptions.push(subscription);
            }
            return subscription;
        };
        Subscription.prototype.remove = function (subscription) {
            var subscriptions = this._subscriptions;
            if (subscriptions) {
                var subscriptionIndex = subscriptions.indexOf(subscription);
                if (subscriptionIndex !== -1) {
                    subscriptions.splice(subscriptionIndex, 1);
                }
            }
        };
        Subscription.EMPTY = (function (empty) {
            empty.closed = true;
            return empty;
        }(new Subscription()));
        return Subscription;
    }());
    function flattenUnsubscriptionErrors(errors) {
        return errors.reduce(function (errs, err) { return errs.concat((err instanceof UnsubscriptionError) ? err.errors : err); }, []);
    }

    /** PURE_IMPORTS_START  PURE_IMPORTS_END */
    var rxSubscriber = /*@__PURE__*/ (function () {
        return typeof Symbol === 'function'
            ? /*@__PURE__*/ Symbol('rxSubscriber')
            : '@@rxSubscriber_' + /*@__PURE__*/ Math.random();
    })();

    /** PURE_IMPORTS_START tslib,_util_isFunction,_Observer,_Subscription,_internal_symbol_rxSubscriber,_config,_util_hostReportError PURE_IMPORTS_END */
    var Subscriber = /*@__PURE__*/ (function (_super) {
        __extends(Subscriber, _super);
        function Subscriber(destinationOrNext, error, complete) {
            var _this = _super.call(this) || this;
            _this.syncErrorValue = null;
            _this.syncErrorThrown = false;
            _this.syncErrorThrowable = false;
            _this.isStopped = false;
            switch (arguments.length) {
                case 0:
                    _this.destination = empty;
                    break;
                case 1:
                    if (!destinationOrNext) {
                        _this.destination = empty;
                        break;
                    }
                    if (typeof destinationOrNext === 'object') {
                        if (destinationOrNext instanceof Subscriber) {
                            _this.syncErrorThrowable = destinationOrNext.syncErrorThrowable;
                            _this.destination = destinationOrNext;
                            destinationOrNext.add(_this);
                        }
                        else {
                            _this.syncErrorThrowable = true;
                            _this.destination = new SafeSubscriber(_this, destinationOrNext);
                        }
                        break;
                    }
                default:
                    _this.syncErrorThrowable = true;
                    _this.destination = new SafeSubscriber(_this, destinationOrNext, error, complete);
                    break;
            }
            return _this;
        }
        Subscriber.prototype[rxSubscriber] = function () { return this; };
        Subscriber.create = function (next, error, complete) {
            var subscriber = new Subscriber(next, error, complete);
            subscriber.syncErrorThrowable = false;
            return subscriber;
        };
        Subscriber.prototype.next = function (value) {
            if (!this.isStopped) {
                this._next(value);
            }
        };
        Subscriber.prototype.error = function (err) {
            if (!this.isStopped) {
                this.isStopped = true;
                this._error(err);
            }
        };
        Subscriber.prototype.complete = function () {
            if (!this.isStopped) {
                this.isStopped = true;
                this._complete();
            }
        };
        Subscriber.prototype.unsubscribe = function () {
            if (this.closed) {
                return;
            }
            this.isStopped = true;
            _super.prototype.unsubscribe.call(this);
        };
        Subscriber.prototype._next = function (value) {
            this.destination.next(value);
        };
        Subscriber.prototype._error = function (err) {
            this.destination.error(err);
            this.unsubscribe();
        };
        Subscriber.prototype._complete = function () {
            this.destination.complete();
            this.unsubscribe();
        };
        Subscriber.prototype._unsubscribeAndRecycle = function () {
            var _parentOrParents = this._parentOrParents;
            this._parentOrParents = null;
            this.unsubscribe();
            this.closed = false;
            this.isStopped = false;
            this._parentOrParents = _parentOrParents;
            return this;
        };
        return Subscriber;
    }(Subscription));
    var SafeSubscriber = /*@__PURE__*/ (function (_super) {
        __extends(SafeSubscriber, _super);
        function SafeSubscriber(_parentSubscriber, observerOrNext, error, complete) {
            var _this = _super.call(this) || this;
            _this._parentSubscriber = _parentSubscriber;
            var next;
            var context = _this;
            if (isFunction(observerOrNext)) {
                next = observerOrNext;
            }
            else if (observerOrNext) {
                next = observerOrNext.next;
                error = observerOrNext.error;
                complete = observerOrNext.complete;
                if (observerOrNext !== empty) {
                    context = Object.create(observerOrNext);
                    if (isFunction(context.unsubscribe)) {
                        _this.add(context.unsubscribe.bind(context));
                    }
                    context.unsubscribe = _this.unsubscribe.bind(_this);
                }
            }
            _this._context = context;
            _this._next = next;
            _this._error = error;
            _this._complete = complete;
            return _this;
        }
        SafeSubscriber.prototype.next = function (value) {
            if (!this.isStopped && this._next) {
                var _parentSubscriber = this._parentSubscriber;
                if (!config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                    this.__tryOrUnsub(this._next, value);
                }
                else if (this.__tryOrSetError(_parentSubscriber, this._next, value)) {
                    this.unsubscribe();
                }
            }
        };
        SafeSubscriber.prototype.error = function (err) {
            if (!this.isStopped) {
                var _parentSubscriber = this._parentSubscriber;
                var useDeprecatedSynchronousErrorHandling = config.useDeprecatedSynchronousErrorHandling;
                if (this._error) {
                    if (!useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                        this.__tryOrUnsub(this._error, err);
                        this.unsubscribe();
                    }
                    else {
                        this.__tryOrSetError(_parentSubscriber, this._error, err);
                        this.unsubscribe();
                    }
                }
                else if (!_parentSubscriber.syncErrorThrowable) {
                    this.unsubscribe();
                    if (useDeprecatedSynchronousErrorHandling) {
                        throw err;
                    }
                    hostReportError(err);
                }
                else {
                    if (useDeprecatedSynchronousErrorHandling) {
                        _parentSubscriber.syncErrorValue = err;
                        _parentSubscriber.syncErrorThrown = true;
                    }
                    else {
                        hostReportError(err);
                    }
                    this.unsubscribe();
                }
            }
        };
        SafeSubscriber.prototype.complete = function () {
            var _this = this;
            if (!this.isStopped) {
                var _parentSubscriber = this._parentSubscriber;
                if (this._complete) {
                    var wrappedComplete = function () { return _this._complete.call(_this._context); };
                    if (!config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                        this.__tryOrUnsub(wrappedComplete);
                        this.unsubscribe();
                    }
                    else {
                        this.__tryOrSetError(_parentSubscriber, wrappedComplete);
                        this.unsubscribe();
                    }
                }
                else {
                    this.unsubscribe();
                }
            }
        };
        SafeSubscriber.prototype.__tryOrUnsub = function (fn, value) {
            try {
                fn.call(this._context, value);
            }
            catch (err) {
                this.unsubscribe();
                if (config.useDeprecatedSynchronousErrorHandling) {
                    throw err;
                }
                else {
                    hostReportError(err);
                }
            }
        };
        SafeSubscriber.prototype.__tryOrSetError = function (parent, fn, value) {
            if (!config.useDeprecatedSynchronousErrorHandling) {
                throw new Error('bad call');
            }
            try {
                fn.call(this._context, value);
            }
            catch (err) {
                if (config.useDeprecatedSynchronousErrorHandling) {
                    parent.syncErrorValue = err;
                    parent.syncErrorThrown = true;
                    return true;
                }
                else {
                    hostReportError(err);
                    return true;
                }
            }
            return false;
        };
        SafeSubscriber.prototype._unsubscribe = function () {
            var _parentSubscriber = this._parentSubscriber;
            this._context = null;
            this._parentSubscriber = null;
            _parentSubscriber.unsubscribe();
        };
        return SafeSubscriber;
    }(Subscriber));

    /** PURE_IMPORTS_START _Subscriber PURE_IMPORTS_END */
    function canReportError(observer) {
        while (observer) {
            var _a = observer, closed_1 = _a.closed, destination = _a.destination, isStopped = _a.isStopped;
            if (closed_1 || isStopped) {
                return false;
            }
            else if (destination && destination instanceof Subscriber) {
                observer = destination;
            }
            else {
                observer = null;
            }
        }
        return true;
    }

    /** PURE_IMPORTS_START _Subscriber,_symbol_rxSubscriber,_Observer PURE_IMPORTS_END */
    function toSubscriber(nextOrObserver, error, complete) {
        if (nextOrObserver) {
            if (nextOrObserver instanceof Subscriber) {
                return nextOrObserver;
            }
            if (nextOrObserver[rxSubscriber]) {
                return nextOrObserver[rxSubscriber]();
            }
        }
        if (!nextOrObserver && !error && !complete) {
            return new Subscriber(empty);
        }
        return new Subscriber(nextOrObserver, error, complete);
    }

    /** PURE_IMPORTS_START  PURE_IMPORTS_END */
    var observable = /*@__PURE__*/ (function () { return typeof Symbol === 'function' && Symbol.observable || '@@observable'; })();

    /** PURE_IMPORTS_START  PURE_IMPORTS_END */
    function identity(x) {
        return x;
    }

    /** PURE_IMPORTS_START _identity PURE_IMPORTS_END */
    function pipeFromArray(fns) {
        if (fns.length === 0) {
            return identity;
        }
        if (fns.length === 1) {
            return fns[0];
        }
        return function piped(input) {
            return fns.reduce(function (prev, fn) { return fn(prev); }, input);
        };
    }

    /** PURE_IMPORTS_START _util_canReportError,_util_toSubscriber,_symbol_observable,_util_pipe,_config PURE_IMPORTS_END */
    var Observable = /*@__PURE__*/ (function () {
        function Observable(subscribe) {
            this._isScalar = false;
            if (subscribe) {
                this._subscribe = subscribe;
            }
        }
        Observable.prototype.lift = function (operator) {
            var observable = new Observable();
            observable.source = this;
            observable.operator = operator;
            return observable;
        };
        Observable.prototype.subscribe = function (observerOrNext, error, complete) {
            var operator = this.operator;
            var sink = toSubscriber(observerOrNext, error, complete);
            if (operator) {
                sink.add(operator.call(sink, this.source));
            }
            else {
                sink.add(this.source || (config.useDeprecatedSynchronousErrorHandling && !sink.syncErrorThrowable) ?
                    this._subscribe(sink) :
                    this._trySubscribe(sink));
            }
            if (config.useDeprecatedSynchronousErrorHandling) {
                if (sink.syncErrorThrowable) {
                    sink.syncErrorThrowable = false;
                    if (sink.syncErrorThrown) {
                        throw sink.syncErrorValue;
                    }
                }
            }
            return sink;
        };
        Observable.prototype._trySubscribe = function (sink) {
            try {
                return this._subscribe(sink);
            }
            catch (err) {
                if (config.useDeprecatedSynchronousErrorHandling) {
                    sink.syncErrorThrown = true;
                    sink.syncErrorValue = err;
                }
                if (canReportError(sink)) {
                    sink.error(err);
                }
                else {
                    console.warn(err);
                }
            }
        };
        Observable.prototype.forEach = function (next, promiseCtor) {
            var _this = this;
            promiseCtor = getPromiseCtor(promiseCtor);
            return new promiseCtor(function (resolve, reject) {
                var subscription;
                subscription = _this.subscribe(function (value) {
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        if (subscription) {
                            subscription.unsubscribe();
                        }
                    }
                }, reject, resolve);
            });
        };
        Observable.prototype._subscribe = function (subscriber) {
            var source = this.source;
            return source && source.subscribe(subscriber);
        };
        Observable.prototype[observable] = function () {
            return this;
        };
        Observable.prototype.pipe = function () {
            var operations = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                operations[_i] = arguments[_i];
            }
            if (operations.length === 0) {
                return this;
            }
            return pipeFromArray(operations)(this);
        };
        Observable.prototype.toPromise = function (promiseCtor) {
            var _this = this;
            promiseCtor = getPromiseCtor(promiseCtor);
            return new promiseCtor(function (resolve, reject) {
                var value;
                _this.subscribe(function (x) { return value = x; }, function (err) { return reject(err); }, function () { return resolve(value); });
            });
        };
        Observable.create = function (subscribe) {
            return new Observable(subscribe);
        };
        return Observable;
    }());
    function getPromiseCtor(promiseCtor) {
        if (!promiseCtor) {
            promiseCtor =  Promise;
        }
        if (!promiseCtor) {
            throw new Error('no Promise impl found');
        }
        return promiseCtor;
    }

    /** PURE_IMPORTS_START  PURE_IMPORTS_END */
    var ObjectUnsubscribedErrorImpl = /*@__PURE__*/ (function () {
        function ObjectUnsubscribedErrorImpl() {
            Error.call(this);
            this.message = 'object unsubscribed';
            this.name = 'ObjectUnsubscribedError';
            return this;
        }
        ObjectUnsubscribedErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
        return ObjectUnsubscribedErrorImpl;
    })();
    var ObjectUnsubscribedError = ObjectUnsubscribedErrorImpl;

    /** PURE_IMPORTS_START tslib,_Subscription PURE_IMPORTS_END */
    var SubjectSubscription = /*@__PURE__*/ (function (_super) {
        __extends(SubjectSubscription, _super);
        function SubjectSubscription(subject, subscriber) {
            var _this = _super.call(this) || this;
            _this.subject = subject;
            _this.subscriber = subscriber;
            _this.closed = false;
            return _this;
        }
        SubjectSubscription.prototype.unsubscribe = function () {
            if (this.closed) {
                return;
            }
            this.closed = true;
            var subject = this.subject;
            var observers = subject.observers;
            this.subject = null;
            if (!observers || observers.length === 0 || subject.isStopped || subject.closed) {
                return;
            }
            var subscriberIndex = observers.indexOf(this.subscriber);
            if (subscriberIndex !== -1) {
                observers.splice(subscriberIndex, 1);
            }
        };
        return SubjectSubscription;
    }(Subscription));

    /** PURE_IMPORTS_START tslib,_Observable,_Subscriber,_Subscription,_util_ObjectUnsubscribedError,_SubjectSubscription,_internal_symbol_rxSubscriber PURE_IMPORTS_END */
    var SubjectSubscriber = /*@__PURE__*/ (function (_super) {
        __extends(SubjectSubscriber, _super);
        function SubjectSubscriber(destination) {
            var _this = _super.call(this, destination) || this;
            _this.destination = destination;
            return _this;
        }
        return SubjectSubscriber;
    }(Subscriber));
    var Subject = /*@__PURE__*/ (function (_super) {
        __extends(Subject, _super);
        function Subject() {
            var _this = _super.call(this) || this;
            _this.observers = [];
            _this.closed = false;
            _this.isStopped = false;
            _this.hasError = false;
            _this.thrownError = null;
            return _this;
        }
        Subject.prototype[rxSubscriber] = function () {
            return new SubjectSubscriber(this);
        };
        Subject.prototype.lift = function (operator) {
            var subject = new AnonymousSubject(this, this);
            subject.operator = operator;
            return subject;
        };
        Subject.prototype.next = function (value) {
            if (this.closed) {
                throw new ObjectUnsubscribedError();
            }
            if (!this.isStopped) {
                var observers = this.observers;
                var len = observers.length;
                var copy = observers.slice();
                for (var i = 0; i < len; i++) {
                    copy[i].next(value);
                }
            }
        };
        Subject.prototype.error = function (err) {
            if (this.closed) {
                throw new ObjectUnsubscribedError();
            }
            this.hasError = true;
            this.thrownError = err;
            this.isStopped = true;
            var observers = this.observers;
            var len = observers.length;
            var copy = observers.slice();
            for (var i = 0; i < len; i++) {
                copy[i].error(err);
            }
            this.observers.length = 0;
        };
        Subject.prototype.complete = function () {
            if (this.closed) {
                throw new ObjectUnsubscribedError();
            }
            this.isStopped = true;
            var observers = this.observers;
            var len = observers.length;
            var copy = observers.slice();
            for (var i = 0; i < len; i++) {
                copy[i].complete();
            }
            this.observers.length = 0;
        };
        Subject.prototype.unsubscribe = function () {
            this.isStopped = true;
            this.closed = true;
            this.observers = null;
        };
        Subject.prototype._trySubscribe = function (subscriber) {
            if (this.closed) {
                throw new ObjectUnsubscribedError();
            }
            else {
                return _super.prototype._trySubscribe.call(this, subscriber);
            }
        };
        Subject.prototype._subscribe = function (subscriber) {
            if (this.closed) {
                throw new ObjectUnsubscribedError();
            }
            else if (this.hasError) {
                subscriber.error(this.thrownError);
                return Subscription.EMPTY;
            }
            else if (this.isStopped) {
                subscriber.complete();
                return Subscription.EMPTY;
            }
            else {
                this.observers.push(subscriber);
                return new SubjectSubscription(this, subscriber);
            }
        };
        Subject.prototype.asObservable = function () {
            var observable = new Observable();
            observable.source = this;
            return observable;
        };
        Subject.create = function (destination, source) {
            return new AnonymousSubject(destination, source);
        };
        return Subject;
    }(Observable));
    var AnonymousSubject = /*@__PURE__*/ (function (_super) {
        __extends(AnonymousSubject, _super);
        function AnonymousSubject(destination, source) {
            var _this = _super.call(this) || this;
            _this.destination = destination;
            _this.source = source;
            return _this;
        }
        AnonymousSubject.prototype.next = function (value) {
            var destination = this.destination;
            if (destination && destination.next) {
                destination.next(value);
            }
        };
        AnonymousSubject.prototype.error = function (err) {
            var destination = this.destination;
            if (destination && destination.error) {
                this.destination.error(err);
            }
        };
        AnonymousSubject.prototype.complete = function () {
            var destination = this.destination;
            if (destination && destination.complete) {
                this.destination.complete();
            }
        };
        AnonymousSubject.prototype._subscribe = function (subscriber) {
            var source = this.source;
            if (source) {
                return this.source.subscribe(subscriber);
            }
            else {
                return Subscription.EMPTY;
            }
        };
        return AnonymousSubject;
    }(Subject));

    var app = (function () {
        function app() {
            this.subjUI = new Subject();
            this.subjRes = new Subject();
            this.num = 0;
            this.collaborateurs = new Map();
            this.set = new Set();
            this.PG = new Map();
            this.incarnation = 0;
            this.reponse = true;
            this.gossip = true;
        }
        app.prototype.getObsUI = function () {
            return this.subjUI.asObservable();
        };
        app.prototype.getObsRes = function () {
            return this.subjRes.asObservable();
        };
        app.prototype.setObsIn = function (obs) {
            var _this = this;
            obs.subscribe(function (data) {
                _this.dispatcher(data);
            });
        };
        app.prototype.dispatcher = function (data) {
            if (data.type === "message") {
                this.traiterMessage(data.contenu);
            }
            else if (data.type === "pingUI") {
                this.pingProcedure(data.contenu);
            }
            else if (data.type === "ajoutChar") {
                this.ajoutChar(data.contenu);
            }
            else if (data.type === "updateUI") {
                this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
            }
            else if (data.type === "stop") {
                this.terminer();
            }
            else {
                this.subjUI.next({ type: "log", contenu: "ERREUR: type inconnu dans le dispatcher app: " + data.type });
            }
        };
        app.prototype.traiterMessage = function (data) {
            var e_1, _a;
            if (this.num === 0) {
                this.num = data.contenu;
                this.subjRes.next({ type: "numUpdate", contenu: this.num });
                this.subjUI.next({ type: "numUpdate", contenu: this.num });
                this.collaborateurs.set(this.num, "Alive");
                this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
                this.subjUI.next({ type: "log", contenu: 'Serveur: Bienvenue ' + this.num });
            }
            else {
                var messtring = "";
                if (data.set !== [] && data.set !== undefined) {
                    this.actualDonnees(data.set);
                }
                if (data.piggyback != []) {
                    var piggyback = new Map(data.piggyback);
                    try {
                        for (var piggyback_1 = __values(piggyback), piggyback_1_1 = piggyback_1.next(); !piggyback_1_1.done; piggyback_1_1 = piggyback_1.next()) {
                            var _b = __read(piggyback_1_1.value, 2), key = _b[0], elem = _b[1];
                            var pgstring = "";
                            switch (elem.message) {
                                case 1:
                                    pgstring = "Joined";
                                    if (!this.collaborateurs.has(key)) {
                                        elem.cpt = K;
                                        this.PG.set(key, elem);
                                        this.collaborateurs.set(key, "Alive");
                                    }
                                    break;
                                case 2:
                                    pgstring = "Alive";
                                    if (this.collaborateurs.has(key) && ((!this.PG.has(key)) || (elem.incarn > this.PG.get(key).incarn))) {
                                        elem.cpt = K;
                                        this.PG.set(key, elem);
                                        this.collaborateurs.set(key, "Alive");
                                    }
                                    break;
                                case 3:
                                    pgstring = "Suspect";
                                    if (key === this.num) {
                                        this.subjUI.next({ type: "log", contenu: 'DEBUG: démenti généré' });
                                        this.incarnation++;
                                        this.PG.set(key, { message: 2, incarn: this.incarnation, cpt: K });
                                    }
                                    else {
                                        if (this.collaborateurs.has(key)) {
                                            var overide = false;
                                            if (this.PG.get(key) === undefined) {
                                                overide = true;
                                            }
                                            else if ((this.PG.get(key).message === 3) && (elem.incarn > this.PG.get(key).incarn)) {
                                                overide = true;
                                            }
                                            else if (((this.PG.get(key).message === 1) || (this.PG.get(key).message === 2)) && (elem.incarn >= this.PG.get(key).incarn)) {
                                                overide = true;
                                            }
                                            if (overide) {
                                                elem.cpt = K;
                                                this.PG.set(key, elem);
                                                this.collaborateurs.set(key, "Suspect");
                                            }
                                        }
                                    }
                                    break;
                                case 4:
                                    pgstring = "Confirm";
                                    if (this.collaborateurs.has(key)) {
                                        if (key === this.num) {
                                            this.subjUI.next({ type: "log", contenu: '!!! You have been declared dead' });
                                            this.subjRes.error(0);
                                        }
                                        elem.cpt = K;
                                        this.PG.set(key, elem);
                                        this.collaborateurs.delete(key);
                                    }
                                    break;
                                default:
                                    if (key === undefined) {
                                        this.subjUI.next({ type: "log", contenu: 'Error: Piggybag on undefined' });
                                    }
                                    else {
                                        this.subjUI.next({ type: "log", contenu: 'SmallError: message de PG inconnu' });
                                    }
                            }
                            this.subjUI.next({ type: "log", contenu: 'PG: ' + pgstring + ' ' + key + ' (' + elem.cpt + ')' });
                            this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (piggyback_1_1 && !piggyback_1_1.done && (_a = piggyback_1.return)) _a.call(piggyback_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                var vapp_1 = this;
                switch (data.message) {
                    case 1:
                        messtring = "ping";
                        this.envoyerMessageDirect(3, data.numEnvoi);
                        break;
                    case 2:
                        messtring = "ping-req";
                        this.envoyerMessageDirect(1, data.numCible);
                        this.reponse = false;
                        setTimeout(function () {
                            var e_2, _a;
                            var toPG = new Map();
                            if (vapp_1.PG !== undefined) {
                                try {
                                    for (var _b = __values(vapp_1.PG), _c = _b.next(); !_c.done; _c = _b.next()) {
                                        var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                                        if (value.cpt > 0) {
                                            value.cpt--;
                                            toPG.set(key, value);
                                        }
                                        else if (vapp_1.collaborateurs.get(key) === "Suspect") {
                                            toPG.set(key, value);
                                        }
                                    }
                                }
                                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                                finally {
                                    try {
                                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                                    }
                                    finally { if (e_2) throw e_2.error; }
                                }
                            }
                            var json = { message: 6, reponse: vapp_1.reponse, numEnvoi: vapp_1.num, numDest: data.numEnvoi, set: Array.from(vapp_1.set), piggyback: Array.from(toPG) };
                            vapp_1.subjRes.next({ type: "message", contenu: json });
                            vapp_1.subjUI.next({ type: "log", contenu: "Sent : ping-reqRep reponse=" + vapp_1.reponse + " (" + vapp_1.num + "->" + data.numEnvoi + ')' });
                        }, coef);
                        break;
                    case 3:
                        messtring = "ack";
                        this.reponse = true;
                        break;
                    case 4:
                        messtring = "data-request";
                        this.collaborateurs.set(data.numEnvoi, "Alive");
                        this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
                        this.envoyerMessageDirect(5, data.numEnvoi);
                        this.PG.set(data.numEnvoi, { message: 1, incarn: this.incarnation, cpt: K });
                        break;
                    case 5:
                        if (data.numEnvoi === this.num) {
                            this.subjUI.next({ type: "log", contenu: 'auto-réponse!!! DEBUG' });
                        }
                        else {
                            messtring = "data-update";
                            this.collaborateurs = new Map(data.users);
                            this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
                            this.subjUI.next({ type: "log", contenu: 'Données mises à jour' });
                        }
                        break;
                    case 6:
                        messtring = "ack(ping-req)";
                        if (data.reponse === true) {
                            this.subjUI.next({ type: "log", contenu: "ping-req réussi" });
                            this.reponse = true;
                        }
                        else {
                            this.subjUI.next({ type: "log", contenu: "ping-req échoué" });
                        }
                        break;
                    default:
                        messtring = "?";
                        this.subjUI.next({ type: "log", contenu: 'Error: message reçu inconnu' });
                }
                this.subjUI.next({ type: "log", contenu: 'Received: ' + messtring + ' (' + data.numDest + '<-' + data.numEnvoi + ')' });
            }
        };
        app.prototype.envoyerMessageDirect = function (numMessage, numDest) {
            var e_3, _a;
            var toPG = new Map();
            if (this.PG !== undefined) {
                try {
                    for (var _b = __values(this.PG), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                        if (value.cpt > 0) {
                            value.cpt--;
                            toPG.set(key, value);
                        }
                        else if (this.collaborateurs.get(key) === "Suspect") {
                            toPG.set(key, value);
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
            var messtring = "";
            switch (numMessage) {
                case 1:
                    messtring = "ping";
                    break;
                case 3:
                    messtring = "ack";
                    break;
                case 5:
                    messtring = "data-update";
                    break;
                default:
                    messtring = "dm inconnu (" + String(numMessage) + ")";
            }
            var json = { message: numMessage, numEnvoi: this.num, numDest: numDest, users: Array.from(this.collaborateurs), set: Array.from(this.set), piggyback: Array.from(toPG) };
            this.subjRes.next({ type: "message", contenu: json });
            this.subjUI.next({ type: "log", contenu: 'Sent: ' + messtring + ' (' + this.num + '->' + numDest + ')' });
        };
        app.prototype.terminer = function () {
            this.PG.set(this.num, { message: 4, incarn: this.incarnation, cpt: K });
            var ens = new Set(this.collaborateurs.keys());
            ens.delete(this.num);
            var numRandom = Math.floor(Math.random() * ens.size);
            var numCollab = Array.from(ens)[numRandom];
            this.subjUI.next({ type: "log", contenu: 'DEBUG: ping aléatoire sur : ' + numCollab });
            this.envoyerMessageDirect(1, numCollab);
            this.subjUI.next({ type: "log", contenu: 'Closed connection 😱' });
            this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
            this.gossip = false;
        };
        app.prototype.actualDonnees = function (nS) {
            var e_4, _a;
            var newSet = new Set(nS);
            try {
                for (var newSet_1 = __values(newSet), newSet_1_1 = newSet_1.next(); !newSet_1_1.done; newSet_1_1 = newSet_1.next()) {
                    var char = newSet_1_1.value;
                    this.set.add(char);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (newSet_1_1 && !newSet_1_1.done && (_a = newSet_1.return)) _a.call(newSet_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
            this.set = new Set(Array.from(this.set).sort());
            this.subjUI.next({ type: "actuSet", contenu: this.set });
        };
        app.prototype.ajoutChar = function (char) {
            if (char !== '') {
                if (this.set.has(char)) {
                    this.subjUI.next({ type: "log", contenu: 'SmallError: ' + char + ' already in the set' });
                }
                else {
                    this.set.add(char);
                    this.subjUI.next({ type: "log", contenu: 'Action: ' + char + ' was added to add the set' });
                    this.subjUI.next({ type: "actuSet", contenu: this.set });
                }
            }
            else {
                this.subjUI.next({ type: "log", contenu: 'SmallError: no char to the set' });
            }
        };
        app.prototype.pingProcedure = function (numCollab) {
            this.envoyerMessageDirect(1, numCollab);
            this.reponse = false;
            var vapp = this;
            setTimeout(function () {
                var e_5, _a;
                var incarnActu = 0;
                if (vapp.PG.has(numCollab)) {
                    incarnActu = vapp.PG.get(numCollab).incarn;
                }
                if (!vapp.reponse) {
                    vapp.subjUI.next({ type: "log", contenu: "pas de réponse au ping direct" });
                    var toPG = new Map();
                    if (vapp.PG !== undefined) {
                        try {
                            for (var _b = __values(vapp.PG), _c = _b.next(); !_c.done; _c = _b.next()) {
                                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                                if (value.cpt > 0) {
                                    value.cpt--;
                                    toPG.set(key, value);
                                }
                                else if (vapp.collaborateurs.get(key) === "Suspect") {
                                    toPG.set(key, value);
                                }
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                    }
                    var i = nbPR;
                    if (i > vapp.collaborateurs.size - 1) {
                        i = vapp.collaborateurs.size - 1;
                    }
                    var ens = new Set(vapp.collaborateurs.keys());
                    ens.delete(vapp.num);
                    ens.delete(numCollab);
                    while (i > 0) {
                        var numRandom = Math.floor(Math.random() * ens.size);
                        var numCollabReq = Array.from(ens)[numRandom];
                        ens.delete(numCollabReq);
                        var json = { message: 2, numEnvoi: vapp.num, numDest: numCollabReq, numCible: numCollab, set: Array.from(vapp.set), piggyback: Array.from(toPG) };
                        vapp.subjRes.next({ type: "message", contenu: json });
                        vapp.subjUI.next({ type: "log", contenu: "Sent : ping-req (" + vapp.num + "->" + numCollabReq + "->" + numCollab + ')' });
                        i--;
                    }
                    clearTimeout();
                    setTimeout(function () {
                        if (vapp.reponse) {
                            vapp.collaborateurs.set(numCollab, "Alive");
                            vapp.subjUI.next({ type: "log", contenu: "réponse au ping-req (Collaborateur OK)" });
                        }
                        else {
                            if (vapp.collaborateurs.get(numCollab) === 'Alive') {
                                vapp.PG.set(numCollab, { message: 3, incarn: incarnActu, cpt: K });
                                vapp.collaborateurs.set(numCollab, "Suspect");
                                vapp.subjUI.next({ type: "log", contenu: "Collaborateur suspect" });
                            }
                            else if (vapp.collaborateurs.get(numCollab) === 'Suspect') {
                                vapp.PG.set(numCollab, { message: 4, incarn: incarnActu, cpt: K });
                                vapp.collaborateurs.delete(numCollab);
                                vapp.subjUI.next({ type: "log", contenu: "Collaborateur mort" });
                            }
                            else {
                                vapp.subjUI.next({ type: "log", contenu: 'SmallError: collaborateur déjà mort' });
                            }
                            vapp.subjUI.next({ type: "actuCollab", contenu: vapp.collaborateurs });
                        }
                    }, 3 * coef);
                }
                else {
                    vapp.subjUI.next({ type: "log", contenu: "réponse au ping (collaborateur OK)" });
                }
            }, coef);
        };
        app.prototype.gossiping = function () {
            if (this.gossip && this.collaborateurs.size > 1 && this.collaborateurs.has(this.num)) {
                var ens = new Set(this.collaborateurs.keys());
                ens.delete(this.num);
                var numRandom = Math.floor(Math.random() * ens.size);
                var numCollab = Array.from(ens)[numRandom];
                this.subjUI.next({ type: "log", contenu: 'DEBUG: ping aléatoire sur : ' + numCollab });
                this.pingProcedure(numCollab);
            }
        };
        return app;
    }());

    var res = (function () {
        function res() {
            this.subjApp = new Subject();
            this.subjUI = new Subject();
            this.bloques = new Set();
            var bloques = this.bloques;
            this.num = 0;
            var vres = this;
            this.socket = new WebSocket('ws://localhost:8081/');
            this.socket.onopen = function () {
                var json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0 });
                 vres.subjUI.next({ type: "log", contenu: "Connexion établie" });
            };
            this.socket.onerror = function (event) {
                vres.subjApp.error(event);
            };
            this.socket.onmessage = function (event) {
                var data = JSON.parse(event.data);
                if ((vres.num === 0) || (data.numEnvoi !== vres.num && (data.numDest === vres.num || data.numDest === 0))) {
                    if (!bloques.has(data.numEnvoi)) {
                        vres.subjApp.next({ type: "message", contenu: data });
                    }
                    else {
                        vres.subjUI.next({ type: "log", contenu: "Message bloqué (collaborateur " + data.numEnvoi + ")" });
                    }
                }
            };
            this.socket.onclose = function () {
                vres.socket.close();
                vres.subjApp.next({ type: "stop", contenu: undefined });
                vres.subjUI.next({ type: "stop", contenu: undefined });
            };
        }
        res.prototype.getObsApp = function () {
            return this.subjApp.asObservable();
        };
        res.prototype.getObsUI = function () {
            return this.subjUI.asObservable();
        };
        res.prototype.setObsIn = function (obs) {
            var _this = this;
            obs.subscribe(function (data) {
                _this.dispatcher(data);
            });
        };
        res.prototype.dispatcher = function (data) {
            if (data.type === "message") {
                this.socket.send(JSON.stringify(data.contenu));
            }
            else if (data.type === "bloquage") {
                this.gererBlocage(data.contenu);
            }
            else if (data.type === "numUpdate") {
                this.num = data.contenu;
            }
            else if (data.type === "stop") {
                this.socket.close();
                this.subjApp.next({ type: "stop", contenu: undefined });
            }
            else {
                this.subjUI.next({ type: "log", contenu: "ERREUR: type inconnu dans le dispatcher res: " + data.type });
            }
        };
        res.prototype.gererBlocage = function (num) {
            if (this.bloques.has(num)) {
                this.bloques.delete(num);
            }
            else {
                this.bloques.add(num);
            }
            this.subjUI.next({ type: "bloquesUpdate", contenu: this.bloques });
            this.subjApp.next({ type: "updateUI", contenu: undefined });
        };
        return res;
    }());

    var ui = (function () {
        function ui() {
            this.subjApp = new Subject();
            this.subjRes = new Subject();
            this.bloques = new Set();
            this.num = 0;
            var vui = this;
            document.querySelector('#close').addEventListener('click', function () {
                vui.subjRes.next({ type: "stop", contenu: undefined });
                $("#titre").empty();
                $("<h1 style=\"text-align: center; color: red\">Collaborateur " + vui.num + " CONNEXION CLOSED</h1>").appendTo($("#titre"));
            });
            document.querySelector('#submbitChar').addEventListener('click', function () {
                var char = document.querySelector('#char').value;
                vui.subjApp.next({ type: "ajoutChar", contenu: char });
            });
        }
        ui.prototype.getObsApp = function () {
            return this.subjApp.asObservable();
        };
        ui.prototype.getObsRes = function () {
            return this.subjRes.asObservable();
        };
        ui.prototype.setObsIn = function (obs) {
            var _this = this;
            obs.subscribe(function (data) {
                _this.dispatcher(data);
            });
        };
        ui.prototype.dispatcher = function (data) {
            if (data.type === "log") {
                this.log(data.contenu);
            }
            else if (data.type === "actuCollab") {
                this.actualCollaborateurs(data.contenu);
            }
            else if (data.type === "actuSet") {
                this.actualSet(data.contenu);
            }
            else if (data.type === "numUpdate") {
                this.num = data.contenu;
                $("<h1 style=\"text-align: center\">Collaborateur " + this.num + "</h1>").appendTo($("#titre"));
            }
            else if (data.type === "bloquesUpdate") {
                this.bloques = data.contenu;
            }
            else if (data.type === "stop") {
                $("#titre").empty();
                $("<h1 style=\"text-align: center; color: red\">Collaborateur " + this.num + " CONNEXION CLOSED</h1>").appendTo($("#titre"));
            }
            else {
                this.log("ERREUR: type inconnu dans le dispatcher UI: " + data.type);
            }
        };
        ui.prototype.actualCollaborateurs = function (collaborateurs) {
            var e_1, _a;
            $("#collaborateurs").empty();
            try {
                for (var collaborateurs_1 = __values(collaborateurs), collaborateurs_1_1 = collaborateurs_1.next(); !collaborateurs_1_1.done; collaborateurs_1_1 = collaborateurs_1.next()) {
                    var _b = __read(collaborateurs_1_1.value, 2), key = _b[0], value = _b[1];
                    if (key === this.num) {
                        $("<li class=\"collabo\">\n                <p>Collaborateur " + key + " (you)</p> \n              </li>").appendTo($("#collaborateurs"));
                    }
                    else {
                        var block = '';
                        if (this.bloques.has(key)) {
                            block = 'X';
                        }
                        $("<li class=\"collabo\">\n                <p>Collaborateur " + key + ' (' + value + ') ' + block + "</p> \n                <INPUT type=\"submit\" class=\"ping\" value=\"ping\" num=\"" + key + "\">\n                <INPUT type=\"submit\" class=\"bloquer\" value=\"bloquer\" num=\"" + key + "\">\n              </li>").appendTo($("#collaborateurs"));
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (collaborateurs_1_1 && !collaborateurs_1_1.done && (_a = collaborateurs_1.return)) _a.call(collaborateurs_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var subjApp = this.subjApp;
            var subjRes = this.subjRes;
            if (document.querySelector('.ping') != null) {
                document.querySelectorAll('.ping').forEach(function (elem) {
                    elem.addEventListener('click', function (event) {
                        var numCollab = parseInt(event.target.getAttribute("num"), 10);
                        subjApp.next({ type: "pingUI", contenu: numCollab });
                    });
                });
                document.querySelectorAll('.bloquer').forEach(function (elem) {
                    elem.addEventListener('click', function (event) {
                        var numero = parseInt(event.target.getAttribute("num"), 10);
                        subjRes.next({ type: "bloquage", contenu: numero });
                    });
                });
            }
        };
        ui.prototype.actualSet = function (set) {
            $("#set").empty();
            $("<p style=\"text-align: center\">Etat acutel du set [" + String(Array.from(set)) + "]</p>").appendTo($("#set"));
        };
        ui.prototype.log = function (text) {
            var li = document.createElement('li');
            li.innerHTML = text;
            document.getElementById('log').appendChild(li);
        };
        return ui;
    }());

    var appli = new app();
    var reseau = new res();
    var uInterface = new ui();
    appli.setObsIn(reseau.getObsApp());
    appli.setObsIn(uInterface.getObsApp());
    reseau.setObsIn(appli.getObsRes());
    reseau.setObsIn(uInterface.getObsRes());
    uInterface.setObsIn(appli.getObsUI());
    uInterface.setObsIn(reseau.getObsUI());
    setInterval(function () { return appli.gossiping(); }, 20 * coef);

}());
//# sourceMappingURL=bundle.js.map
