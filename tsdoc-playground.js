(function(e, a) { for(var i in a) e[i] = a[i]; }(this, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.tsx");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../tsdoc/lib/details/ModifierTagSet.js":
/*!**********************************************!*\
  !*** ../tsdoc/lib/details/ModifierTagSet.js ***!
  \**********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var TSDocTagDefinition_1 = __webpack_require__(/*! ../parser/TSDocTagDefinition */ "../tsdoc/lib/parser/TSDocTagDefinition.js");
/**
 * Represents a set of modifier tags that were extracted from a doc comment.
 *
 * @remarks
 * TSDoc modifier tags are block tags that do not have any associated rich text content.
 * Instead, their presence or absence acts as an on/off switch, indicating some aspect
 * of the underlying API item.  For example, the `@internal` modifier indicates that a
 * signature is internal (i.e. not part of the public API contract).
 */
var ModifierTagSet = /** @class */ (function () {
    function ModifierTagSet() {
        this._nodes = [];
        // NOTE: To implement case insensitivity, the keys in this set are always upper-case.
        // This convention makes the normalization more obvious (and as a general practice handles
        // the Turkish "i" character correctly).
        this._nodesByName = new Map();
    }
    Object.defineProperty(ModifierTagSet.prototype, "nodes", {
        /**
         * The original block tag nodes that defined the modifiers in this set, excluding duplicates.
         */
        get: function () {
            return this._nodes;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns true if the set contains a DocBlockTag with the specified tag name.
     * Note that synonyms are not considered.  The comparison is case-insensitive.
     * @param modifierTagName - The name of the tag, including the `@` prefix  For example, `@internal`
     */
    ModifierTagSet.prototype.hasTagName = function (modifierTagName) {
        return this._nodesByName.has(modifierTagName.toUpperCase());
    };
    /**
     * Returns true if the set contains a DocBlockTag matching the specified tag definition.
     * Note that synonyms are not considered.  The comparison is case-insensitive.
     * The TSDocTagDefinition must be a modifier tag.
     * @param tagName - The name of the tag, including the `@` prefix  For example, `@internal`
     */
    ModifierTagSet.prototype.hasTag = function (modifierTagDefinition) {
        return !!this.tryGetTag(modifierTagDefinition);
    };
    /**
     * Returns a DocBlockTag matching the specified tag definition, or undefined if no such
     * tag was added to the set.  If there were multiple instances, returned object will be
     * the first one to be added.
     */
    ModifierTagSet.prototype.tryGetTag = function (modifierTagDefinition) {
        if (modifierTagDefinition.syntaxKind !== TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag) {
            throw new Error('The tag definition is not a modifier tag');
        }
        return this._nodesByName.get(modifierTagDefinition.tagNameWithUpperCase);
    };
    /**
     * Adds a new modifier tag to the set.  If a tag already exists with the same name,
     * then no change is made, and the return value is false.
     */
    ModifierTagSet.prototype.addTag = function (blockTag) {
        if (this._nodesByName.has(blockTag.tagNameWithUpperCase)) {
            return false;
        }
        this._nodesByName.set(blockTag.tagNameWithUpperCase, blockTag);
        this._nodes.push(blockTag);
        return true;
    };
    return ModifierTagSet;
}());
exports.ModifierTagSet = ModifierTagSet;
//# sourceMappingURL=ModifierTagSet.js.map

/***/ }),

/***/ "../tsdoc/lib/details/StandardModifierTagSet.js":
/*!******************************************************!*\
  !*** ../tsdoc/lib/details/StandardModifierTagSet.js ***!
  \******************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ModifierTagSet_1 = __webpack_require__(/*! ./ModifierTagSet */ "../tsdoc/lib/details/ModifierTagSet.js");
var StandardTags_1 = __webpack_require__(/*! ./StandardTags */ "../tsdoc/lib/details/StandardTags.js");
/**
 * Extends the ModifierTagSet base class with getters for modifiers that
 * are part of the standardized core tags for TSDoc.
 */
var StandardModifierTagSet = /** @class */ (function (_super) {
    __extends(StandardModifierTagSet, _super);
    function StandardModifierTagSet() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Returns true if the `@alpha` modifier tag was specified.
     */
    StandardModifierTagSet.prototype.isAlpha = function () {
        return this.hasTag(StandardTags_1.StandardTags.alpha);
    };
    /**
     * Returns true if the `@beta` modifier tag was specified.
     */
    StandardModifierTagSet.prototype.isBeta = function () {
        return this.hasTag(StandardTags_1.StandardTags.beta);
    };
    /**
     * Returns true if the `@eventProperty` modifier tag was specified.
     */
    StandardModifierTagSet.prototype.isEventProperty = function () {
        return this.hasTag(StandardTags_1.StandardTags.eventProperty);
    };
    /**
     * Returns true if the `@experimental` modifier tag was specified.
     */
    StandardModifierTagSet.prototype.isExperimental = function () {
        return this.hasTag(StandardTags_1.StandardTags.experimental);
    };
    /**
     * Returns true if the `@internal` modifier tag was specified.
     */
    StandardModifierTagSet.prototype.isInternal = function () {
        return this.hasTag(StandardTags_1.StandardTags.internal);
    };
    /**
     * Returns true if the `@override` modifier tag was specified.
     */
    StandardModifierTagSet.prototype.isOverride = function () {
        return this.hasTag(StandardTags_1.StandardTags.override);
    };
    /**
     * Returns true if the `@packageDocumentation` modifier tag was specified.
     */
    StandardModifierTagSet.prototype.isPackageDocumentation = function () {
        return this.hasTag(StandardTags_1.StandardTags.packageDocumentation);
    };
    /**
     * Returns true if the `@public` modifier tag was specified.
     */
    StandardModifierTagSet.prototype.isPublic = function () {
        return this.hasTag(StandardTags_1.StandardTags.public);
    };
    /**
     * Returns true if the `@readonly` modifier tag was specified.
     */
    StandardModifierTagSet.prototype.isReadonly = function () {
        return this.hasTag(StandardTags_1.StandardTags.readonly);
    };
    /**
     * Returns true if the `@sealed` modifier tag was specified.
     */
    StandardModifierTagSet.prototype.isSealed = function () {
        return this.hasTag(StandardTags_1.StandardTags.sealed);
    };
    /**
     * Returns true if the `@virtual` modifier tag was specified.
     */
    StandardModifierTagSet.prototype.isVirtual = function () {
        return this.hasTag(StandardTags_1.StandardTags.virtual);
    };
    return StandardModifierTagSet;
}(ModifierTagSet_1.ModifierTagSet));
exports.StandardModifierTagSet = StandardModifierTagSet;
//# sourceMappingURL=StandardModifierTagSet.js.map

/***/ }),

/***/ "../tsdoc/lib/details/StandardTags.js":
/*!********************************************!*\
  !*** ../tsdoc/lib/details/StandardTags.js ***!
  \********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var TSDocTagDefinition_1 = __webpack_require__(/*! ../parser/TSDocTagDefinition */ "../tsdoc/lib/parser/TSDocTagDefinition.js");
/**
 * Tags whose meaning is defined by the TSDoc standard.
 */
var StandardTags = /** @class */ (function () {
    function StandardTags() {
    }
    StandardTags._defineTag = function (parameters) {
        return new TSDocTagDefinition_1.TSDocTagDefinition(parameters);
    };
    /**
     * (Discretionary)
     *
     * Suggested meaning: Designates that an API item's release stage is "alpha".
     * It is intended to be used by third-party developers eventually, but has not
     * yet been released.  The tooling may trim the declaration from a public release.
     *
     * Example implementations: API Extractor
     */
    StandardTags.alpha = StandardTags._defineTag({
        tagName: '@alpha',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag,
        standardization: "Discretionary" /* Discretionary */
    });
    /**
     * (Discretionary)
     *
     * Suggested meaning: Designates that an API item's release stage is "beta".
     * It has been released to third-party developers experimentally for the purpose of
     * collecting feedback.  The API should not be used in production, because its contract may
     * change without notice.  The tooling may trim the declaration from a public release,
     * but may include it in a developer preview release.
     *
     * Example implementations: API Extractor
     *
     * Synonyms: `@experimental`
     */
    StandardTags.beta = StandardTags._defineTag({
        tagName: '@beta',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag,
        standardization: "Discretionary" /* Discretionary */
    });
    /**
     * (Core)
     *
     * This block tag communicates that an API item is no loner supported and may be removed
     * in a future release.  The `@deprecated` tag is followed by a sentence describing
     * the recommended alternative.  It recursively applies to members of the container.
     * For example, if a class is deprecated, then so are all of its members.
     */
    StandardTags.deprecated = StandardTags._defineTag({
        tagName: '@deprecated',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.BlockTag,
        standardization: "Core" /* Core */
    });
    /**
     * (Extended)
     *
     * This block tag is used to document the default value for a field or property,
     * if a value is not assigned explicitly.
     *
     * @remarks
     * This tag should only be used with fields or properties that are members of a class or interface.
     */
    StandardTags.defaultValue = StandardTags._defineTag({
        tagName: '@defaultValue',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.BlockTag,
        standardization: "Extended" /* Extended */
    });
    /**
     * (Extended)
     *
     * When applied to a class or interface property, this indicates that the property
     * returns an event object that event handlers can be attached to.  The event-handling
     * API is implementation-defined, but typically the property return type would be a class
     * with members such as `addHandler()` and `removeHandler()`.  A documentation tool can
     * display such properties under an "Events" heading instead of the usual "Properties" heading.
     */
    StandardTags.eventProperty = StandardTags._defineTag({
        tagName: '@eventProperty',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag,
        standardization: "Extended" /* Extended */
    });
    /**
     * (Extended)
     *
     * Indicates a documentation section that should be presented as an example
     * illustrating how to use the API.  It may include a code sample.
     */
    StandardTags.example = StandardTags._defineTag({
        tagName: '@example',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.BlockTag,
        allowMultiple: true,
        standardization: "Extended" /* Extended */
    });
    /**
     * (Discretionary)
     *
     * Suggested meaning:  Same semantics as `@beta`, but used by tools that don't support
     * an `@alpha` release stage.
     *
     * Example implementations: Angular API documenter
     *
     * Synonyms: `@beta`
     */
    StandardTags.experimental = StandardTags._defineTag({
        tagName: '@experimental',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag,
        standardization: "Discretionary" /* Discretionary */
    });
    /**
     * (Extended)
     *
     * This inline tag is used to automatically generate an API item's documentation by
     * copying it from another API item.  The inline tag parameter contains a reference
     * to the other item, which may be an unrelated class, or even an import from a
     * separate NPM package.
     *
     * TODO: The notation for API item references is still being standardized.  See this issue:
     * https://github.com/Microsoft/tsdoc/issues/9
     */
    StandardTags.inheritDoc = StandardTags._defineTag({
        tagName: '@inheritDoc',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.InlineTag,
        standardization: "Extended" /* Extended */
    });
    /**
     * (Discretionary)
     *
     * Suggested meaning:  Designates that an API item is not planned to be used by
     * third-party developers.  The tooling may trim the declaration from a public release.
     * In some implementations, certain designated packages may be allowed to consume
     * internal API items, e.g. because the packages are components of the same product.
     *
     * Example implementations: API Extractor
     */
    StandardTags.internal = StandardTags._defineTag({
        tagName: '@internal',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag,
        standardization: "Discretionary" /* Discretionary */
    });
    /**
     * (Core)
     *
     * The `{@label}` inline tag is used to label a declaration, so that it can be referenced
     * using a selector in the TSDoc declaration reference notation.
     *
     * TODO: The `{@label}` notation is still being standardized.  See this issue:
     * https://github.com/Microsoft/tsdoc/issues/9
     */
    StandardTags.label = StandardTags._defineTag({
        tagName: '@label',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.InlineTag,
        standardization: "Core" /* Core */
    });
    /**
     * (Core)
     *
     * The `{@link}` inline tag is used to create hyperlinks to other pages in a
     * documentation system or general internet URLs.  In particular, it supports
     * expressions for referencing API items.
     *
     * TODO: The `{@link}` notation is still being standardized.  See this issue:
     * https://github.com/Microsoft/tsdoc/issues/9
     */
    StandardTags.link = StandardTags._defineTag({
        tagName: '@link',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.InlineTag,
        allowMultiple: true,
        standardization: "Core" /* Core */
    });
    /**
     * (Extended)
     *
     * This modifier has similar semantics to the `override` keyword in C# or Java.
     * For a member function or property, explicitly indicates that this definition
     * is overriding (i.e. redefining) the definition inherited from the base class.
     * The base class definition would normally be marked as `virtual`.
     *
     * A documentation tool may enforce that the `@virtual`, `@override`, and/or `@sealed`
     * modifiers are consistently applied, but this is not required by the TSDoc standard.
     */
    StandardTags.override = StandardTags._defineTag({
        tagName: '@override',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag,
        standardization: "Extended" /* Extended */
    });
    /**
     * (Core)
     *
     * Used to indicate a doc comment that describes an entire NPM package (as opposed
     * to an individual API item belonging to that package).  The `@packageDocumentation` comment
     * is found in the *.d.ts file that acts as the entry point for the package, and it
     * should be the first `/**` comment encountered in that file.  A comment containing a
     * `@packageDocumentation` tag should never be used to describe an individual API item.
     */
    StandardTags.packageDocumentation = StandardTags._defineTag({
        tagName: '@packageDocumentation',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag,
        standardization: "Core" /* Core */
    });
    /**
     * (Core)
     *
     * Used to document a function parameter.  The `@param` tag is followed by a parameter
     * name, followed by a hyphen, followed by a description.  The TSDoc parser recognizes
     * this syntax and will extract it into a DocParamBlock node.
     */
    StandardTags.param = StandardTags._defineTag({
        tagName: '@param',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.BlockTag,
        allowMultiple: true,
        standardization: "Core" /* Core */
    });
    /**
     * (Core)
     *
     * Starts a section of additional documentation content that is not intended for a
     * public audience.  A tool must omit this entire section from the API reference web site,
     * generated *.d.ts file, and any other outputs incorporating the content.
     */
    StandardTags.privateRemarks = StandardTags._defineTag({
        tagName: '@privateRemarks',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.BlockTag,
        standardization: "Core" /* Core */
    });
    /**
     * (Discretionary)
     *
     * Suggested meaning: Designates that an API item's release stage is "public".
     * It has been officially released to third-party developers, and its signature is
     * guaranteed to be stable (e.g. following Semantic Versioning rules).
     *
     * Example implementations: API Extractor
     */
    StandardTags.public = StandardTags._defineTag({
        tagName: '@public',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag,
        standardization: "Discretionary" /* Discretionary */
    });
    /**
     * (Extended)
     *
     * This modifier tag indicates that an API item should be documented as being read-only,
     * even if the TypeScript type system may indicate otherwise.  For example, suppose a
     * class property has a setter function that always throws an exception explaining that
     * the property cannot be assigned; in this situation, the `@readonly` modifier can be
     * added so that the property is shown as read-only in the documentation.
     *
     * Example implementations: API Extractor
     */
    StandardTags.readonly = StandardTags._defineTag({
        tagName: '@readonly',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag,
        standardization: "Extended" /* Extended */
    });
    /**
     * (Core)
     *
     * The main documentation for an API item is separated into a brief "summary" section,
     * optionally followed by a more detailed "remarks" section.  On a documentation web site,
     * index pages (e.g. showing members of a class) will show only the brief summaries,
     * whereas a detail pages (e.g. describing a single member) will show the summary followed
     * by the remarks.  The `@remarks` block tag ends the summary section, and begins the
     * remarks section for a doc comment.
     */
    StandardTags.remarks = StandardTags._defineTag({
        tagName: '@remarks',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.BlockTag,
        standardization: "Core" /* Core */
    });
    /**
     * (Core)
     *
     * Used to document the return value for a function.
     */
    StandardTags.returns = StandardTags._defineTag({
        tagName: '@returns',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.BlockTag,
        standardization: "Core" /* Core */
    });
    /**
     * (Extended)
     *
     * This modifier has similar semantics to the `sealed` keyword in C# or Java.
     * For a class, indicates that subclasses must not inherit from the class.
     * For a member function or property, indicates that subclasses must not override
     * (i.e. redefine) the member.
     *
     * A documentation tool may enforce that the `@virtual`, `@override`, and/or `@sealed`
     * modifiers are consistently applied, but this is not required by the TSDoc standard.
     */
    StandardTags.sealed = StandardTags._defineTag({
        tagName: '@sealed',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag,
        standardization: "Extended" /* Extended */
    });
    /**
     * (Core)
     *
     * Used to document a generic parameter.  The `@typeParam` tag is followed by a parameter
     * name, followed by a hyphen, followed by a description.  The TSDoc parser recognizes
     * this syntax and will extract it into a DocParamBlock node.
     */
    StandardTags.typeParam = StandardTags._defineTag({
        tagName: '@typeParam',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.BlockTag,
        allowMultiple: true,
        standardization: "Core" /* Core */
    });
    /**
     * (Extended)
     *
     * This modifier has similar semantics to the `virtual` keyword in C# or Java.
     * For a member function or property, explicitly indicates that subclasses may override
     * (i.e. redefine) the member.
     *
     * A documentation tool may enforce that the `@virtual`, `@override`, and/or `@sealed`
     * modifiers are consistently applied, but this is not required by the TSDoc standard.
     */
    StandardTags.virtual = StandardTags._defineTag({
        tagName: '@virtual',
        syntaxKind: TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag,
        standardization: "Extended" /* Extended */
    });
    /**
     * Returns the full list of all core tags.
     */
    StandardTags.allDefinitions = [
        StandardTags.alpha,
        StandardTags.beta,
        StandardTags.deprecated,
        StandardTags.defaultValue,
        StandardTags.eventProperty,
        StandardTags.example,
        StandardTags.experimental,
        StandardTags.inheritDoc,
        StandardTags.internal,
        StandardTags.label,
        StandardTags.link,
        StandardTags.override,
        StandardTags.packageDocumentation,
        StandardTags.param,
        StandardTags.privateRemarks,
        StandardTags.public,
        StandardTags.readonly,
        StandardTags.remarks,
        StandardTags.returns,
        StandardTags.sealed,
        StandardTags.typeParam,
        StandardTags.virtual
    ];
    return StandardTags;
}());
exports.StandardTags = StandardTags;
//# sourceMappingURL=StandardTags.js.map

/***/ }),

/***/ "../tsdoc/lib/index.js":
/*!*****************************!*\
  !*** ../tsdoc/lib/index.js ***!
  \*****************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var StandardTags_1 = __webpack_require__(/*! ./details/StandardTags */ "../tsdoc/lib/details/StandardTags.js");
exports.StandardTags = StandardTags_1.StandardTags;
var StandardModifierTagSet_1 = __webpack_require__(/*! ./details/StandardModifierTagSet */ "../tsdoc/lib/details/StandardModifierTagSet.js");
exports.StandardModifierTagSet = StandardModifierTagSet_1.StandardModifierTagSet;
var ModifierTagSet_1 = __webpack_require__(/*! ./details/ModifierTagSet */ "../tsdoc/lib/details/ModifierTagSet.js");
exports.ModifierTagSet = ModifierTagSet_1.ModifierTagSet;
__export(__webpack_require__(/*! ./nodes */ "../tsdoc/lib/nodes/index.js"));
var Excerpt_1 = __webpack_require__(/*! ./parser/Excerpt */ "../tsdoc/lib/parser/Excerpt.js");
exports.Excerpt = Excerpt_1.Excerpt;
var ParserContext_1 = __webpack_require__(/*! ./parser/ParserContext */ "../tsdoc/lib/parser/ParserContext.js");
exports.ParserContext = ParserContext_1.ParserContext;
var ParserMessage_1 = __webpack_require__(/*! ./parser/ParserMessage */ "../tsdoc/lib/parser/ParserMessage.js");
exports.ParserMessage = ParserMessage_1.ParserMessage;
var ParserMessageLog_1 = __webpack_require__(/*! ./parser/ParserMessageLog */ "../tsdoc/lib/parser/ParserMessageLog.js");
exports.ParserMessageLog = ParserMessageLog_1.ParserMessageLog;
var TextRange_1 = __webpack_require__(/*! ./parser/TextRange */ "../tsdoc/lib/parser/TextRange.js");
exports.TextRange = TextRange_1.TextRange;
var Token_1 = __webpack_require__(/*! ./parser/Token */ "../tsdoc/lib/parser/Token.js");
exports.Token = Token_1.Token;
exports.TokenKind = Token_1.TokenKind;
var TokenSequence_1 = __webpack_require__(/*! ./parser/TokenSequence */ "../tsdoc/lib/parser/TokenSequence.js");
exports.TokenSequence = TokenSequence_1.TokenSequence;
var TSDocParser_1 = __webpack_require__(/*! ./parser/TSDocParser */ "../tsdoc/lib/parser/TSDocParser.js");
exports.TSDocParser = TSDocParser_1.TSDocParser;
var TSDocParserConfiguration_1 = __webpack_require__(/*! ./parser/TSDocParserConfiguration */ "../tsdoc/lib/parser/TSDocParserConfiguration.js");
exports.TSDocParserConfiguration = TSDocParserConfiguration_1.TSDocParserConfiguration;
exports.TSDocParserValidationConfiguration = TSDocParserConfiguration_1.TSDocParserValidationConfiguration;
var TSDocTagDefinition_1 = __webpack_require__(/*! ./parser/TSDocTagDefinition */ "../tsdoc/lib/parser/TSDocTagDefinition.js");
exports.TSDocTagSyntaxKind = TSDocTagDefinition_1.TSDocTagSyntaxKind;
exports.TSDocTagDefinition = TSDocTagDefinition_1.TSDocTagDefinition;
var DocNodeTransforms_1 = __webpack_require__(/*! ./transforms/DocNodeTransforms */ "../tsdoc/lib/transforms/DocNodeTransforms.js");
exports.DocNodeTransforms = DocNodeTransforms_1.DocNodeTransforms;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocBlock.js":
/*!**************************************!*\
  !*** ../tsdoc/lib/nodes/DocBlock.js ***!
  \**************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocSection_1 = __webpack_require__(/*! ./DocSection */ "../tsdoc/lib/nodes/DocSection.js");
/**
 * Represents a section that is introduced by a TSDoc block tag.
 * For example, an `@example` block.
 */
var DocBlock = /** @class */ (function (_super) {
    __extends(DocBlock, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocBlock(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "Block" /* Block */;
        return _this;
    }
    Object.defineProperty(DocBlock.prototype, "blockTag", {
        /**
         * The TSDoc tag that introduces this section.
         */
        get: function () {
            return this._blockTag;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocBlock.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._blockTag = parameters.blockTag;
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocBlock.prototype.getChildNodes = function () {
        return [this.blockTag].concat(_super.prototype.getChildNodes.call(this));
    };
    return DocBlock;
}(DocSection_1.DocSection));
exports.DocBlock = DocBlock;
//# sourceMappingURL=DocBlock.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocBlockTag.js":
/*!*****************************************!*\
  !*** ../tsdoc/lib/nodes/DocBlockTag.js ***!
  \*****************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNodeLeaf_1 = __webpack_require__(/*! ./DocNodeLeaf */ "../tsdoc/lib/nodes/DocNodeLeaf.js");
var StringChecks_1 = __webpack_require__(/*! ../parser/StringChecks */ "../tsdoc/lib/parser/StringChecks.js");
/**
 * Represents a TSDoc block tag such as `@param` or `@public`.
 */
var DocBlockTag = /** @class */ (function (_super) {
    __extends(DocBlockTag, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocBlockTag(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "BlockTag" /* BlockTag */;
        return _this;
    }
    Object.defineProperty(DocBlockTag.prototype, "tagName", {
        /**
         * The TSDoc tag name.  TSDoc tag names start with an at-sign ("@") followed
         * by ASCII letters using "camelCase" capitalization.
         */
        get: function () {
            return this._tagName;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocBlockTag.prototype, "tagNameWithUpperCase", {
        /**
         * The TSDoc tag name in all capitals, which is used for performing
         * case-insensitive comparisons or lookups.
         */
        get: function () {
            return this._tagNameWithUpperCase;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocBlockTag.prototype.updateParameters = function (parameters) {
        StringChecks_1.StringChecks.validateTSDocTagName(parameters.tagName);
        _super.prototype.updateParameters.call(this, parameters);
        this._tagName = parameters.tagName;
        this._tagNameWithUpperCase = this.tagName.toUpperCase();
    };
    return DocBlockTag;
}(DocNodeLeaf_1.DocNodeLeaf));
exports.DocBlockTag = DocBlockTag;
//# sourceMappingURL=DocBlockTag.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocCodeSpan.js":
/*!*****************************************!*\
  !*** ../tsdoc/lib/nodes/DocCodeSpan.js ***!
  \*****************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
/**
 * Represents CommonMark-style code span, i.e. code surrounded by
 * backtick characters.
 */
var DocCodeSpan = /** @class */ (function (_super) {
    __extends(DocCodeSpan, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocCodeSpan(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "CodeSpan" /* CodeSpan */;
        return _this;
    }
    Object.defineProperty(DocCodeSpan.prototype, "code", {
        /**
         * The text that should be rendered as code, excluding the backtick delimiters.
         */
        get: function () {
            return this._codeParticle.content;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocCodeSpan.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._openingDelimiterParticle = new DocParticle_1.DocParticle({
            particleId: 'openingDelimiter',
            excerpt: parameters.openingDelimiterExcerpt,
            content: '`'
        });
        this._codeParticle = new DocParticle_1.DocParticle({
            particleId: 'code',
            excerpt: parameters.codeExcerpt,
            content: parameters.code
        });
        this._closingDelimiterParticle = new DocParticle_1.DocParticle({
            particleId: 'closingDelimiter',
            excerpt: parameters.closingDelimiterExcerpt,
            content: '`'
        });
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocCodeSpan.prototype.getChildNodes = function () {
        return [
            this._openingDelimiterParticle,
            this._codeParticle,
            this._closingDelimiterParticle
        ];
    };
    return DocCodeSpan;
}(DocNode_1.DocNode));
exports.DocCodeSpan = DocCodeSpan;
//# sourceMappingURL=DocCodeSpan.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocComment.js":
/*!****************************************!*\
  !*** ../tsdoc/lib/nodes/DocComment.js ***!
  \****************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocSection_1 = __webpack_require__(/*! ./DocSection */ "../tsdoc/lib/nodes/DocSection.js");
var StandardModifierTagSet_1 = __webpack_require__(/*! ../details/StandardModifierTagSet */ "../tsdoc/lib/details/StandardModifierTagSet.js");
/**
 * Represents an entire documentation comment conforming to the TSDoc structure.
 * This is the root of the DocNode tree.
 */
var DocComment = /** @class */ (function (_super) {
    __extends(DocComment, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocComment(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "Comment" /* Comment */;
        _this.summarySection = new DocSection_1.DocSection(parameters);
        _this.remarksBlock = undefined;
        _this.privateRemarks = undefined;
        _this.deprecatedBlock = undefined;
        _this.paramBlocks = [];
        _this.typeParamBlocks = [];
        _this.returnsBlock = undefined;
        _this.modifierTagSet = new StandardModifierTagSet_1.StandardModifierTagSet();
        _this._customBlocks = [];
        return _this;
    }
    Object.defineProperty(DocComment.prototype, "customBlocks", {
        /**
         * The collection of all DocBlock nodes belonging to this doc comment.
         */
        get: function () {
            return this._customBlocks;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Append an item to the customBlocks collection.
     */
    DocComment.prototype.appendCustomBlock = function (block) {
        this._customBlocks.push(block);
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocComment.prototype.getChildNodes = function () {
        return DocNode_1.DocNode.trimUndefinedNodes([
            this.summarySection,
            this.remarksBlock,
            this.privateRemarks,
            this.deprecatedBlock
        ].concat(this.paramBlocks, this.typeParamBlocks, [
            this.returnsBlock
        ], this._customBlocks, [
            this.inheritDocTag
        ], this.modifierTagSet.nodes));
    };
    return DocComment;
}(DocNode_1.DocNode));
exports.DocComment = DocComment;
//# sourceMappingURL=DocComment.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocDeclarationReference.js":
/*!*****************************************************!*\
  !*** ../tsdoc/lib/nodes/DocDeclarationReference.js ***!
  \*****************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
/**
 * Represents a declaration reference.
 *
 * @remarks
 * Declaration references are TSDoc expressions used by tags such as `{@link}`
 * or `{@inheritDoc}` that need to refer to another declaration.
 */
var DocDeclarationReference = /** @class */ (function (_super) {
    __extends(DocDeclarationReference, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocDeclarationReference(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "DeclarationReference" /* DeclarationReference */;
        return _this;
    }
    Object.defineProperty(DocDeclarationReference.prototype, "packageName", {
        /**
         * The optional package name, which may optionally include an NPM scope.
         *
         * Example: `"@scope/my-package"`
         */
        get: function () {
            if (this._packageNameParticle) {
                return this._packageNameParticle.content;
            }
            else {
                return undefined;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocDeclarationReference.prototype, "importPath", {
        /**
         * The optional import path.  If a package name is provided, then if an import path is provided,
         * the path must start with a "/" delimiter; otherwise paths are resolved relative to the source file
         * containing the reference.
         *
         * Example: `"/path1/path2"`
         * Example: `"./path1/path2"`
         * Example: `"../path2/path2"`
         */
        get: function () {
            if (this._importPathParticle) {
                return this._importPathParticle.content;
            }
            else {
                return undefined;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocDeclarationReference.prototype, "memberReferences", {
        /**
         * The chain of member references that indicate the declaration being referenced.
         * If this list is empty, then either the packageName or importPath must be provided,
         * because the reference refers to a module.
         */
        get: function () {
            return this._memberReferences;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocDeclarationReference.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._packageNameParticle = undefined;
        this._importPathParticle = undefined;
        this._importHashParticle = undefined;
        if (parameters.packageName) {
            this._packageNameParticle = new DocParticle_1.DocParticle({
                particleId: 'packageName',
                content: parameters.packageName,
                excerpt: parameters.packageNameExcerpt
            });
        }
        if (parameters.importPath) {
            this._importPathParticle = new DocParticle_1.DocParticle({
                particleId: 'importPath',
                content: parameters.importPath || '',
                excerpt: parameters.importPathExcerpt
            });
        }
        if ((parameters.packageName && this._importPathParticle) || parameters.importHashExcerpt) {
            this._importHashParticle = new DocParticle_1.DocParticle({
                particleId: 'importHash',
                content: '#',
                excerpt: parameters.importHashExcerpt
            });
        }
        this._memberReferences = parameters.memberReferences || [];
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocDeclarationReference.prototype.getChildNodes = function () {
        return DocNode_1.DocNode.trimUndefinedNodes([
            this._packageNameParticle,
            this._importPathParticle,
            this._importHashParticle
        ].concat(this._memberReferences));
    };
    return DocDeclarationReference;
}(DocNode_1.DocNode));
exports.DocDeclarationReference = DocDeclarationReference;
//# sourceMappingURL=DocDeclarationReference.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocErrorText.js":
/*!******************************************!*\
  !*** ../tsdoc/lib/nodes/DocErrorText.js ***!
  \******************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNodeLeaf_1 = __webpack_require__(/*! ./DocNodeLeaf */ "../tsdoc/lib/nodes/DocNodeLeaf.js");
/**
 * Represents a span of text that contained invalid markup.
 * The characters should be rendered as plain text.
 */
var DocErrorText = /** @class */ (function (_super) {
    __extends(DocErrorText, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocErrorText(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "ErrorText" /* ErrorText */;
        return _this;
    }
    Object.defineProperty(DocErrorText.prototype, "text", {
        /**
         * The characters that should be rendered as plain text because they
         * could not be parsed successfully.
         */
        get: function () {
            return this._text;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocErrorText.prototype, "errorMessage", {
        /**
         * A description of why the character could not be parsed.
         */
        get: function () {
            return this._errorMessage;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocErrorText.prototype, "errorLocation", {
        /**
         * The range of characters that caused the error.  In general these may be
         * somewhat farther ahead in the input stream from the DocErrorText node itself.
         *
         * @remarks
         * For example, for the malformed HTML tag `<a href="123" @ /a>`, the DocErrorText node
         * will correspond to the `<` character that looked like an HTML tag, whereas the
         * error location might be the `@` character that caused the trouble.
         */
        get: function () {
            return this._errorLocation;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocErrorText.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._text = parameters.text;
        this._errorMessage = parameters.errorMessage;
        this._errorLocation = parameters.errorLocation;
    };
    return DocErrorText;
}(DocNodeLeaf_1.DocNodeLeaf));
exports.DocErrorText = DocErrorText;
//# sourceMappingURL=DocErrorText.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocEscapedText.js":
/*!********************************************!*\
  !*** ../tsdoc/lib/nodes/DocEscapedText.js ***!
  \********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNodeLeaf_1 = __webpack_require__(/*! ./DocNodeLeaf */ "../tsdoc/lib/nodes/DocNodeLeaf.js");
/**
 * The style of escaping to be used with DocEscapedText.
 */
var EscapeStyle;
(function (EscapeStyle) {
    /**
     * Use a backslash symbol to escape the character.
     */
    EscapeStyle[EscapeStyle["CommonMarkBackslash"] = 0] = "CommonMarkBackslash";
})(EscapeStyle = exports.EscapeStyle || (exports.EscapeStyle = {}));
/**
 * Represents a text character that should be escaped as a TSDoc symbol.
 * @remarks
 * Note that renders will normally apply appropriate escaping when rendering
 * DocPlainText in a format such as HTML or TSDoc.  The DocEscapedText node
 * forces a specific escaping that may not be the default.
 */
var DocEscapedText = /** @class */ (function (_super) {
    __extends(DocEscapedText, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocEscapedText(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "EscapedText" /* EscapedText */;
        return _this;
    }
    Object.defineProperty(DocEscapedText.prototype, "escapeStyle", {
        /**
         * The style of escaping to be performed.
         */
        get: function () {
            return this._escapeStyle;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocEscapedText.prototype, "text", {
        /**
         * The text content to be escaped.
         */
        get: function () {
            return this._text;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocEscapedText.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._escapeStyle = parameters.escapeStyle;
        this._text = parameters.text;
    };
    return DocEscapedText;
}(DocNodeLeaf_1.DocNodeLeaf));
exports.DocEscapedText = DocEscapedText;
//# sourceMappingURL=DocEscapedText.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocFencedCode.js":
/*!*******************************************!*\
  !*** ../tsdoc/lib/nodes/DocFencedCode.js ***!
  \*******************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
/**
 * Represents CommonMark-style code fence, i.e. a block of program code that
 * starts and ends with a line comprised of three backticks.  The opening delimiter
 * can also specify a language for a syntax highlighter.
 */
var DocFencedCode = /** @class */ (function (_super) {
    __extends(DocFencedCode, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocFencedCode(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "FencedCode" /* FencedCode */;
        return _this;
    }
    Object.defineProperty(DocFencedCode.prototype, "language", {
        /**
         * A name that can optionally be included after the opening code fence delimiter,
         * on the same line as the three backticks.  This name indicates the programming language
         * for the code, which a syntax highlighter may use to style the code block.
         *
         * @remarks
         * The TSDoc standard requires that the language "ts" should be interpreted to mean TypeScript.
         * Other languages names may be supported, but this is implementation dependent.
         *
         * CommonMark refers to this field as the "info string".
         *
         * @privateRemarks
         * Examples of language strings supported by GitHub flavored markdown:
         * https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml
         */
        get: function () {
            return this._languageParticle.content;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocFencedCode.prototype, "code", {
        /**
         * The text that should be rendered as code.
         */
        get: function () {
            return this._codeParticle.content;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocFencedCode.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._openingDelimiterParticle = new DocParticle_1.DocParticle({
            particleId: 'openingDelimiter',
            excerpt: parameters.openingDelimiterExcerpt,
            content: '```'
        });
        this._languageParticle = new DocParticle_1.DocParticle({
            particleId: 'language',
            excerpt: parameters.languageExcerpt,
            content: parameters.language || ''
        });
        this._codeParticle = new DocParticle_1.DocParticle({
            particleId: 'code',
            excerpt: parameters.codeExcerpt,
            content: parameters.code
        });
        this._closingDelimiterParticle = new DocParticle_1.DocParticle({
            particleId: 'closingDelimiter',
            excerpt: parameters.closingDelimiterExcerpt,
            content: '```'
        });
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocFencedCode.prototype.getChildNodes = function () {
        return [
            this._openingDelimiterParticle,
            this._languageParticle,
            this._codeParticle,
            this._closingDelimiterParticle
        ];
    };
    return DocFencedCode;
}(DocNode_1.DocNode));
exports.DocFencedCode = DocFencedCode;
//# sourceMappingURL=DocFencedCode.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocHtmlAttribute.js":
/*!**********************************************!*\
  !*** ../tsdoc/lib/nodes/DocHtmlAttribute.js ***!
  \**********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
/**
 * Represents an HTML attribute inside a DocHtmlStartTag or DocHtmlEndTag.
 *
 * Example: `href="#"` inside `<a href="#" />`
 */
var DocHtmlAttribute = /** @class */ (function (_super) {
    __extends(DocHtmlAttribute, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocHtmlAttribute(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "HtmlAttribute" /* HtmlAttribute */;
        return _this;
    }
    Object.defineProperty(DocHtmlAttribute.prototype, "attributeName", {
        /**
         * The HTML attribute name.
         */
        get: function () {
            return this._attributeNameParticle.content;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocHtmlAttribute.prototype, "spacingAfterAttributeName", {
        /**
         * Explicit whitespace that a renderer should insert after the HTML attribute name.
         * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
         */
        get: function () {
            return this._attributeNameParticle.spacingAfterContent;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocHtmlAttribute.prototype, "spacingAfterEquals", {
        /**
         * Explicit whitespace that a renderer should insert after the "=".
         * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
         */
        get: function () {
            return this._equalsParticle.spacingAfterContent;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocHtmlAttribute.prototype, "attributeValue", {
        /**
         * The HTML attribute value.
         */
        get: function () {
            return this._attributeValueParticle.content;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocHtmlAttribute.prototype, "spacingAfterAttributeValue", {
        /**
         * Explicit whitespace that a renderer should insert after the HTML attribute name.
         * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
         */
        get: function () {
            return this._attributeValueParticle.spacingAfterContent;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocHtmlAttribute.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._attributeNameParticle = new DocParticle_1.DocParticle({
            particleId: 'attributeName',
            excerpt: parameters.attributeNameExcerpt,
            content: parameters.attributeName,
            spacingAfterContent: parameters.spacingAfterAttributeName
        });
        this._equalsParticle = new DocParticle_1.DocParticle({
            particleId: 'equals',
            excerpt: parameters.equalsExcerpt,
            content: '=',
            spacingAfterContent: parameters.spacingAfterEquals
        });
        this._attributeValueParticle = new DocParticle_1.DocParticle({
            particleId: 'attributeValue',
            excerpt: parameters.attributeValueExcerpt,
            content: parameters.attributeValue,
            spacingAfterContent: parameters.spacingAfterAttributeValue
        });
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocHtmlAttribute.prototype.getChildNodes = function () {
        return [this._attributeNameParticle, this._equalsParticle, this._attributeValueParticle];
    };
    return DocHtmlAttribute;
}(DocNode_1.DocNode));
exports.DocHtmlAttribute = DocHtmlAttribute;
//# sourceMappingURL=DocHtmlAttribute.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocHtmlEndTag.js":
/*!*******************************************!*\
  !*** ../tsdoc/lib/nodes/DocHtmlEndTag.js ***!
  \*******************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
/**
 * Represents an HTML end tag.  Example: `</a>`
 */
var DocHtmlEndTag = /** @class */ (function (_super) {
    __extends(DocHtmlEndTag, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocHtmlEndTag(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "HtmlEndTag" /* HtmlEndTag */;
        return _this;
    }
    Object.defineProperty(DocHtmlEndTag.prototype, "elementName", {
        /**
         * The HTML element name.
         */
        get: function () {
            return this._elementNameParticle.content;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocHtmlEndTag.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._openingDelimiterParticle = new DocParticle_1.DocParticle({
            particleId: 'openingDelimiter',
            excerpt: parameters.openingDelimiterExcerpt,
            content: '</'
        });
        this._elementNameParticle = new DocParticle_1.DocParticle({
            particleId: 'elementName',
            excerpt: parameters.elementNameExcerpt,
            content: parameters.elementName
        });
        this._closingDelimiterParticle = new DocParticle_1.DocParticle({
            particleId: 'closingDelimiter',
            excerpt: parameters.closingDelimiterExcerpt,
            content: '>'
        });
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocHtmlEndTag.prototype.getChildNodes = function () {
        return [
            this._openingDelimiterParticle,
            this._elementNameParticle,
            this._closingDelimiterParticle
        ];
    };
    return DocHtmlEndTag;
}(DocNode_1.DocNode));
exports.DocHtmlEndTag = DocHtmlEndTag;
//# sourceMappingURL=DocHtmlEndTag.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocHtmlStartTag.js":
/*!*********************************************!*\
  !*** ../tsdoc/lib/nodes/DocHtmlStartTag.js ***!
  \*********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
/**
 * Represents an HTML start tag, which may or may not be self-closing.
 *
 * Example: `<a href="#" />`
 */
var DocHtmlStartTag = /** @class */ (function (_super) {
    __extends(DocHtmlStartTag, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocHtmlStartTag(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "HtmlStartTag" /* HtmlStartTag */;
        return _this;
    }
    Object.defineProperty(DocHtmlStartTag.prototype, "elementName", {
        /**
         * The HTML element name.
         */
        get: function () {
            return this._elementNameParticle.content;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocHtmlStartTag.prototype, "htmlAttributes", {
        /**
         * The HTML attributes belonging to this HTML element.
         */
        get: function () {
            return this._htmlAttributes;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocHtmlStartTag.prototype, "selfClosingTag", {
        /**
         * If true, then the HTML tag ends with "/>" instead of ">".
         */
        get: function () {
            return this._selfClosingTag;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocHtmlStartTag.prototype, "spacingAfterElementName", {
        /**
         * Explicit whitespace that a renderer should insert after the HTML element name.
         * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
         */
        get: function () {
            return this._elementNameParticle.spacingAfterContent;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocHtmlStartTag.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._openingDelimiterParticle = new DocParticle_1.DocParticle({
            particleId: 'openingDelimiter',
            excerpt: parameters.openingDelimiterExcerpt,
            content: '<'
        });
        this._elementNameParticle = new DocParticle_1.DocParticle({
            particleId: 'elementName',
            excerpt: parameters.elementNameExcerpt,
            content: parameters.elementName,
            spacingAfterContent: parameters.spacingAfterElementName
        });
        this._htmlAttributes = parameters.htmlAttributes;
        this._selfClosingTag = parameters.selfClosingTag;
        this._closingDelimiterParticle = new DocParticle_1.DocParticle({
            particleId: 'closingDelimiter',
            excerpt: parameters.closingDelimiterExcerpt,
            content: parameters.selfClosingTag ? '/>' : '>'
        });
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocHtmlStartTag.prototype.getChildNodes = function () {
        return [
            this._openingDelimiterParticle,
            this._elementNameParticle
        ].concat(this._htmlAttributes, [
            this._closingDelimiterParticle
        ]);
    };
    return DocHtmlStartTag;
}(DocNode_1.DocNode));
exports.DocHtmlStartTag = DocHtmlStartTag;
//# sourceMappingURL=DocHtmlStartTag.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocInheritDocTag.js":
/*!**********************************************!*\
  !*** ../tsdoc/lib/nodes/DocInheritDocTag.js ***!
  \**********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocInlineTag_1 = __webpack_require__(/*! ./DocInlineTag */ "../tsdoc/lib/nodes/DocInlineTag.js");
/**
 * Represents an `{@inheritDoc}` tag.
 */
var DocInheritDocTag = /** @class */ (function (_super) {
    __extends(DocInheritDocTag, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocInheritDocTag(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "InheritDocTag" /* InheritDocTag */;
        return _this;
    }
    Object.defineProperty(DocInheritDocTag.prototype, "declarationReference", {
        /**
         * The declaration that the documentation will be inherited from.
         * If omitted, the documentation will be inherited from the parent class.
         */
        get: function () {
            return this._declarationReference;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocInheritDocTag.prototype.updateParameters = function (parameters) {
        if (parameters.tagName.toUpperCase() !== '@INHERITDOC') {
            throw new Error('DocInheritDocTag requires the tag name to be "{@inheritDoc}"');
        }
        _super.prototype.updateParameters.call(this, parameters);
        this._declarationReference = parameters.declarationReference;
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocInheritDocTag.prototype.getChildNodesForContent = function () {
        if (this.tagContentParticle.excerpt) {
            // If the parser associated the inline tag input with the tagContentExcerpt (e.g. because
            // second stage parsing encountered an error), then fall back to the base class's representation
            return _super.prototype.getChildNodesForContent.call(this);
        }
        else {
            // Otherwise return the detailed structure
            return DocNode_1.DocNode.trimUndefinedNodes([
                this._declarationReference
            ]);
        }
    };
    return DocInheritDocTag;
}(DocInlineTag_1.DocInlineTag));
exports.DocInheritDocTag = DocInheritDocTag;
//# sourceMappingURL=DocInheritDocTag.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocInlineTag.js":
/*!******************************************!*\
  !*** ../tsdoc/lib/nodes/DocInlineTag.js ***!
  \******************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var StringChecks_1 = __webpack_require__(/*! ../parser/StringChecks */ "../tsdoc/lib/parser/StringChecks.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
/**
 * Represents a TSDoc inline tag such as `{@inheritDoc}` or `{@link}`.
 */
var DocInlineTag = /** @class */ (function (_super) {
    __extends(DocInlineTag, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocInlineTag(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "InlineTag" /* InlineTag */;
        return _this;
    }
    Object.defineProperty(DocInlineTag.prototype, "tagName", {
        /**
         * The TSDoc tag name.
         * For example, if the inline tag is `{@link Guid.toString | the toString() method}`
         * then the tag name would be `@link`.
         */
        get: function () {
            return this._tagNameParticle.content;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocInlineTag.prototype, "tagContent", {
        /**
         * The tag content.
         * For example, if the inline tag is `{@link Guid.toString | the toString() method}`
         * then the tag content would be `Guid.toString | the toString() method`.
         */
        get: function () {
            return this._tagContentParticle.content;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocInlineTag.prototype.updateParameters = function (parameters) {
        StringChecks_1.StringChecks.validateTSDocTagName(parameters.tagName);
        _super.prototype.updateParameters.call(this, parameters);
        this._openingDelimiterParticle = new DocParticle_1.DocParticle({
            particleId: 'openingDelimiter',
            excerpt: parameters.openingDelimiterExcerpt,
            content: '{'
        });
        this._tagNameParticle = new DocParticle_1.DocParticle({
            particleId: 'tagName',
            excerpt: parameters.tagNameExcerpt,
            content: parameters.tagName
        });
        this._tagContentParticle = new DocParticle_1.DocParticle({
            particleId: 'tagContent',
            excerpt: parameters.tagContentExcerpt,
            content: parameters.tagContent
        });
        this._closingDelimiterParticle = new DocParticle_1.DocParticle({
            particleId: 'closingDelimiter',
            excerpt: parameters.closingDelimiterExcerpt,
            content: '}'
        });
    };
    /**
     * {@inheritDoc}
     * @override @sealed
     */
    DocInlineTag.prototype.getChildNodes = function () {
        return [
            this._openingDelimiterParticle,
            this._tagNameParticle
        ].concat(this.getChildNodesForContent(), [
            this._closingDelimiterParticle
        ]);
    };
    /**
     * Allows child classes to replace the tagContentParticle with a more detailed
     * set of nodes.
     * @virtual
     */
    DocInlineTag.prototype.getChildNodesForContent = function () {
        return [
            this._tagContentParticle
        ];
    };
    Object.defineProperty(DocInlineTag.prototype, "tagContentParticle", {
        get: function () {
            return this._tagContentParticle;
        },
        enumerable: true,
        configurable: true
    });
    return DocInlineTag;
}(DocNode_1.DocNode));
exports.DocInlineTag = DocInlineTag;
//# sourceMappingURL=DocInlineTag.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocLinkTag.js":
/*!****************************************!*\
  !*** ../tsdoc/lib/nodes/DocLinkTag.js ***!
  \****************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocInlineTag_1 = __webpack_require__(/*! ./DocInlineTag */ "../tsdoc/lib/nodes/DocInlineTag.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
/**
 * Represents an `{@link}` tag.
 */
var DocLinkTag = /** @class */ (function (_super) {
    __extends(DocLinkTag, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocLinkTag(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "LinkTag" /* LinkTag */;
        return _this;
    }
    Object.defineProperty(DocLinkTag.prototype, "codeDestination", {
        /**
         * If the link tag refers to a declaration, this returns the declaration reference object;
         * otherwise this property is undefined.
         * @remarks
         * Either the `codeDestination` or the `urlDestination` property will be defined, but never both.
         */
        get: function () {
            return this._codeDestination;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocLinkTag.prototype, "urlDestination", {
        /**
         * If the link tag was an ordinary URI, this returns the URL string;
         * otherwise this property is undefined.
         * @remarks
         * Either the `codeDestination` or the `urlDestination` property will be defined, but never both.
         */
        get: function () {
            return this._urlDestinationParticle ? this._urlDestinationParticle.content : undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocLinkTag.prototype, "linkText", {
        /**
         * An optional text string that is the hyperlink text.  If omitted, the documentation
         * renderer will use a default string based on the link itself (e.g. the URL text
         * or the declaration identifier).
         */
        get: function () {
            if (this._linkTextParticle) {
                return this._linkTextParticle.content;
            }
            else {
                return undefined;
            }
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocLinkTag.prototype.updateParameters = function (parameters) {
        if (parameters.tagName.toUpperCase() !== '@LINK') {
            throw new Error('DocLinkTag requires the tag name to be "{@link}"');
        }
        if (parameters.codeDestination !== undefined) {
            if (parameters.urlDestination !== undefined) {
                throw new Error('Either the codeLink or the documentLink may be specified, but not both');
            }
        }
        if (parameters.tagContentExcerpt !== undefined) {
            if (parameters.codeDestination || parameters.urlDestinationExcerpt || parameters.linkTextExcerpt) {
                // This would violate the TokenCoverageChecker properties
                throw new Error('The input cannot be associated with tagContentExcerpt and also the detail excerpts');
            }
        }
        _super.prototype.updateParameters.call(this, parameters);
        this._codeDestination = undefined;
        this._urlDestinationParticle = undefined;
        this._pipeParticle = undefined;
        this._linkTextParticle = undefined;
        if (parameters.codeDestination) {
            this._codeDestination = parameters.codeDestination;
        }
        else if (parameters.urlDestination !== undefined) {
            this._urlDestinationParticle = new DocParticle_1.DocParticle({
                particleId: 'urlDestination',
                excerpt: parameters.urlDestinationExcerpt,
                content: parameters.urlDestination
            });
        }
        if (parameters.linkTextExcerpt || parameters.linkText || parameters.pipeExcerpt) {
            this._pipeParticle = new DocParticle_1.DocParticle({
                particleId: 'pipe',
                excerpt: parameters.pipeExcerpt,
                content: '|'
            });
        }
        if (parameters.linkText !== undefined) {
            this._linkTextParticle = new DocParticle_1.DocParticle({
                particleId: 'linkText',
                excerpt: parameters.linkTextExcerpt,
                content: parameters.linkText
            });
        }
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocLinkTag.prototype.getChildNodesForContent = function () {
        if (this.tagContentParticle.excerpt) {
            // If the parser associated the inline tag input with the tagContentExcerpt (e.g. because
            // second stage parsing encountered an error), then fall back to the base class's representation
            return _super.prototype.getChildNodesForContent.call(this);
        }
        else {
            // Otherwise return the detailed structure
            return DocNode_1.DocNode.trimUndefinedNodes([
                this._urlDestinationParticle,
                this._codeDestination,
                this._pipeParticle,
                this._linkTextParticle
            ]);
        }
    };
    return DocLinkTag;
}(DocInlineTag_1.DocInlineTag));
exports.DocLinkTag = DocLinkTag;
//# sourceMappingURL=DocLinkTag.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocMemberIdentifier.js":
/*!*************************************************!*\
  !*** ../tsdoc/lib/nodes/DocMemberIdentifier.js ***!
  \*************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
var StringChecks_1 = __webpack_require__(/*! ../parser/StringChecks */ "../tsdoc/lib/parser/StringChecks.js");
/**
 * A member identifier is part of a {@link DocMemberReference}.
 */
var DocMemberIdentifier = /** @class */ (function (_super) {
    __extends(DocMemberIdentifier, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocMemberIdentifier(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "MemberIdentifier" /* MemberIdentifier */;
        return _this;
    }
    /**
     * Returns true if the specified string is a valid TypeScript
     * identifier.  If not, {@link DocMemberIdentifier.hasQuotes} will be
     * required.
     */
    DocMemberIdentifier.isValidIdentifier = function (identifier) {
        return !StringChecks_1.StringChecks.explainIfInvalidUnquotedIdentifier(identifier);
    };
    Object.defineProperty(DocMemberIdentifier.prototype, "identifier", {
        /**
         * The identifier string without any quote encoding.
         *
         * @remarks
         * If the value is not a valid ECMAScript identifier, it will be quoted as a
         * string literal during rendering.
         */
        get: function () {
            return this._identifierParticle.content;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocMemberIdentifier.prototype, "hasQuotes", {
        /**
         * Returns true if the identifier will be rendered as a quoted string literal
         * instead of as a programming language identifier.  This is required if the
         * `identifier` property is not a valid ECMAScript identifier.
         */
        get: function () {
            return !!this._leftQuoteParticle;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocMemberIdentifier.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._leftQuoteParticle = undefined;
        this._identifierParticle = undefined;
        this._rightQuoteParticle = undefined;
        if (parameters.leftQuoteExcerpt || !DocMemberIdentifier.isValidIdentifier(parameters.identifier)) {
            this._leftQuoteParticle = new DocParticle_1.DocParticle({
                particleId: 'leftQuote',
                excerpt: parameters.leftQuoteExcerpt,
                content: '"'
            });
        }
        this._identifierParticle = new DocParticle_1.DocParticle({
            particleId: 'identifier',
            excerpt: parameters.identifierExcerpt,
            content: parameters.identifier
        });
        if (this._leftQuoteParticle) {
            this._rightQuoteParticle = new DocParticle_1.DocParticle({
                particleId: 'rightQuote',
                excerpt: parameters.rightQuoteExcerpt,
                content: '"'
            });
        }
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocMemberIdentifier.prototype.getChildNodes = function () {
        return DocNode_1.DocNode.trimUndefinedNodes([
            this._leftQuoteParticle,
            this._identifierParticle,
            this._rightQuoteParticle
        ]);
    };
    return DocMemberIdentifier;
}(DocNode_1.DocNode));
exports.DocMemberIdentifier = DocMemberIdentifier;
//# sourceMappingURL=DocMemberIdentifier.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocMemberReference.js":
/*!************************************************!*\
  !*** ../tsdoc/lib/nodes/DocMemberReference.js ***!
  \************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
/**
 * A {@link DocDeclarationReference | declaration reference} includes a chain of
 * member references represented using `DocMemberReference` nodes.
 *
 * @remarks
 * For example, `example-library#ui.controls.Button.(render:static)` is a
 * declaration reference that contains three member references:
 * `ui`, `.controls`, and `.Button`, and `.(render:static)`.
 */
var DocMemberReference = /** @class */ (function (_super) {
    __extends(DocMemberReference, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocMemberReference(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "MemberReference" /* MemberReference */;
        return _this;
    }
    Object.defineProperty(DocMemberReference.prototype, "hasDot", {
        /**
         * True if this member reference is preceded by a dot (".") token.
         * It should be false only for the first member in the chain.
         */
        get: function () {
            return !!this._dotParticle;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocMemberReference.prototype, "memberIdentifier", {
        /**
         * The identifier for the referenced member.
         * @remarks
         * Either `memberIdentifier` or `memberSymbol` may be specified, but not both.
         */
        get: function () {
            return this._memberIdentifier;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocMemberReference.prototype, "memberSymbol", {
        /**
         * The ECMAScript 6 symbol expression, which may be used instead of an identifier
         * to indicate the referenced member.
         * @remarks
         * Either `memberIdentifier` or `memberSymbol` may be specified, but not both.
         */
        get: function () {
            return this._memberSymbol;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocMemberReference.prototype, "selector", {
        /**
         * A TSDoc selector, which may be optionally when the identifier or symbol is insufficient
         * to unambiguously determine the referenced declaration.
         */
        get: function () {
            return this._selector;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocMemberReference.prototype.updateParameters = function (parameters) {
        if (parameters.memberIdentifier && parameters.memberSymbol) {
            throw new Error('"memberIdentifier" or "memberSymbol" may be specified, but not both');
        }
        _super.prototype.updateParameters.call(this, parameters);
        this._dotParticle = undefined;
        this._leftParenthesisParticle = undefined;
        this._colonParticle = undefined;
        this._selector = undefined;
        this._rightParenthesisParticle = undefined;
        if (parameters.hasDot || parameters.dotExcerpt) {
            this._dotParticle = new DocParticle_1.DocParticle({
                particleId: 'dot',
                excerpt: parameters.dotExcerpt,
                content: '.'
            });
        }
        if (parameters.leftParenthesisExcerpt || parameters.selector) {
            this._leftParenthesisParticle = new DocParticle_1.DocParticle({
                particleId: 'leftParenthesis',
                excerpt: parameters.leftParenthesisExcerpt,
                content: '('
            });
        }
        this._memberIdentifier = parameters.memberIdentifier;
        this._memberSymbol = parameters.memberSymbol;
        if (parameters.colonExcerpt || parameters.selector) {
            this._colonParticle = new DocParticle_1.DocParticle({
                particleId: 'colon',
                excerpt: parameters.colonExcerpt,
                content: ':'
            });
        }
        this._selector = parameters.selector;
        if (this._leftParenthesisParticle) {
            this._rightParenthesisParticle = new DocParticle_1.DocParticle({
                particleId: 'rightParenthesis',
                excerpt: parameters.rightParenthesisExcerpt,
                content: ')'
            });
        }
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocMemberReference.prototype.getChildNodes = function () {
        return DocNode_1.DocNode.trimUndefinedNodes([
            this._dotParticle,
            this._leftParenthesisParticle,
            this._memberIdentifier,
            this._memberSymbol,
            this._colonParticle,
            this._selector,
            this._rightParenthesisParticle
        ]);
    };
    return DocMemberReference;
}(DocNode_1.DocNode));
exports.DocMemberReference = DocMemberReference;
//# sourceMappingURL=DocMemberReference.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocMemberSelector.js":
/*!***********************************************!*\
  !*** ../tsdoc/lib/nodes/DocMemberSelector.js ***!
  \***********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNodeLeaf_1 = __webpack_require__(/*! ./DocNodeLeaf */ "../tsdoc/lib/nodes/DocNodeLeaf.js");
var StringChecks_1 = __webpack_require__(/*! ../parser/StringChecks */ "../tsdoc/lib/parser/StringChecks.js");
/**
 */
var DocMemberSelector = /** @class */ (function (_super) {
    __extends(DocMemberSelector, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocMemberSelector(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "MemberSelector" /* MemberSelector */;
        return _this;
    }
    Object.defineProperty(DocMemberSelector.prototype, "selector", {
        /**
         * The text representation of the selector.
         *
         * @remarks
         * For system selectors, it will be a predefined lower case name.
         * For label selectors, it will be an upper case name defined using the `{@label}` tag.
         * For index selectors, it will be a positive integer.
         */
        get: function () {
            return this._selector;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocMemberSelector.prototype, "selectorKind", {
        /**
         * Indicates the kind of selector.
         */
        get: function () {
            return this._selectorKind;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocMemberSelector.prototype, "errorMessage", {
        /**
         * If the `selectorKind` is `SelectorKind.Error`, this string will be defined and provide
         * more detail about why the string was not valid.
         */
        get: function () {
            return this._errorMessage;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocMemberSelector.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._selector = parameters.selector;
        this._selectorKind = "error" /* Error */;
        this._errorMessage = undefined;
        // The logic below will always either (1) assign selectorKind or (2) else assign an errorMessage
        if (this._selector.length === 0) {
            this._errorMessage = 'The selector cannot be an empty string';
        }
        else if (DocMemberSelector._likeIndexSelectorRegExp.test(this._selector)) {
            // It looks like an index selector
            if (DocMemberSelector._indexSelectorRegExp.test(this._selector)) {
                this._selectorKind = "index" /* Index */;
            }
            else {
                this._errorMessage = 'If the selector begins with a number, it must be a positive integer value';
            }
        }
        else if (DocMemberSelector._likeLabelSelectorRegExp.test(this._selector)) {
            // It looks like a label selector
            if (DocMemberSelector._labelSelectorRegExp.test(this._selector)) {
                this._selectorKind = "label" /* Label */;
            }
            else {
                this._errorMessage = 'A label selector must be comprised of upper case letters, numbers,'
                    + ' and underscores and must not start with a number';
            }
        }
        else {
            if (StringChecks_1.StringChecks.isSystemSelector(this._selector)) {
                this._selectorKind = "system" /* System */;
            }
            else if (DocMemberSelector._likeSystemSelectorRegExp.test(this._selector)) {
                // It looks like a system selector, but is not
                this._errorMessage = "The selector " + JSON.stringify(this._selector)
                    + " is not a recognized TSDoc system selector name";
            }
            else {
                // It doesn't look like anything we recognize
                this._errorMessage = 'Invalid syntax for selector';
            }
        }
    };
    DocMemberSelector._likeIndexSelectorRegExp = /^[0-9]/;
    DocMemberSelector._indexSelectorRegExp = /^[1-9][0-9]*$/;
    DocMemberSelector._likeLabelSelectorRegExp = /^[A-Z_]/u;
    DocMemberSelector._labelSelectorRegExp = /^[A-Z_][A-Z0-9_]+$/;
    DocMemberSelector._likeSystemSelectorRegExp = /^[a-z]+$/u;
    return DocMemberSelector;
}(DocNodeLeaf_1.DocNodeLeaf));
exports.DocMemberSelector = DocMemberSelector;
//# sourceMappingURL=DocMemberSelector.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocMemberSymbol.js":
/*!*********************************************!*\
  !*** ../tsdoc/lib/nodes/DocMemberSymbol.js ***!
  \*********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
/**
 * Represents a reference to an ECMAScript 6 symbol that is used
 * to identify a member declaration.
 *
 * @example
 *
 * In the declaration reference `{@link MyClass.([MySymbols.example]:instance)}`,
 * the member symbol `[MySymbols.example]` might be used to reference a property
 * of the class.
 */
var DocMemberSymbol = /** @class */ (function (_super) {
    __extends(DocMemberSymbol, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocMemberSymbol(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "MemberSymbol" /* MemberSymbol */;
        return _this;
    }
    Object.defineProperty(DocMemberSymbol.prototype, "symbolReference", {
        /**
         * The declaration reference for the ECMAScript 6 symbol that will act as
         * the identifier for the member.
         */
        get: function () {
            return this._symbolReference;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocMemberSymbol.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._leftBracketParticle = new DocParticle_1.DocParticle({
            particleId: 'leftBracket',
            excerpt: parameters.leftBracketExcerpt,
            content: '['
        });
        this._symbolReference = parameters.symbolReference;
        this._rightBracketParticle = new DocParticle_1.DocParticle({
            particleId: 'rightBracket',
            excerpt: parameters.rightBracketExcerpt,
            content: ']'
        });
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocMemberSymbol.prototype.getChildNodes = function () {
        return [
            this._leftBracketParticle,
            this._symbolReference,
            this._rightBracketParticle
        ];
    };
    return DocMemberSymbol;
}(DocNode_1.DocNode));
exports.DocMemberSymbol = DocMemberSymbol;
//# sourceMappingURL=DocMemberSymbol.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocNode.js":
/*!*************************************!*\
  !*** ../tsdoc/lib/nodes/DocNode.js ***!
  \*************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The base class for the parser's Abstract Syntax Tree nodes.
 */
var DocNode = /** @class */ (function () {
    function DocNode(parameters) {
        this.updateParameters(parameters);
    }
    /**
     * Returns the array with any undefined elements removed.
     */
    DocNode.trimUndefinedNodes = function (nodes) {
        return nodes.filter(function (x) { return x; });
    };
    DocNode.validateSpacing = function (spacing, parameterName) {
        if (spacing) {
            var match = DocNode._badSpacingRegExp.exec(spacing);
            if (match) {
                var badCharacter = match[0];
                throw new Error("The \"" + parameterName + "\" value contains a non-whitespace character \"" + badCharacter + "\"");
            }
        }
    };
    /** @virtual */
    DocNode.prototype.updateParameters = function (parameters) {
        // (virtual)
    };
    /**
     * Returns the list of child nodes for this node.  This is useful for visitors that want
     * to scan the tree looking for nodes of a specific type, without having to process
     * intermediary nodes.
     * @virtual
     */
    DocNode.prototype.getChildNodes = function () {
        return [];
    };
    DocNode._badSpacingRegExp = /\S/;
    return DocNode;
}());
exports.DocNode = DocNode;
//# sourceMappingURL=DocNode.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocNodeContainer.js":
/*!**********************************************!*\
  !*** ../tsdoc/lib/nodes/DocNodeContainer.js ***!
  \**********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
/**
 * DocNodeContainer is the base class for DocNode classes that act as a simple container
 * for other child nodes.  The child classes are {@link DocParagraph} and {@link DocSection}.
 */
var DocNodeContainer = /** @class */ (function (_super) {
    __extends(DocNodeContainer, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocNodeContainer(parameters) {
        return _super.call(this, parameters) || this;
    }
    Object.defineProperty(DocNodeContainer.prototype, "nodes", {
        /**
         * The child nodes.  Note that for subclasses {@link getChildNodes()} may enumerate
         * additional nodes that are not part of this collection.
         */
        get: function () {
            return this._nodes;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocNodeContainer.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        if (this._nodes === undefined) {
            this._nodes = [];
        }
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocNodeContainer.prototype.getChildNodes = function () {
        return this._nodes;
    };
    /**
     * Returns true if the specified `docNode` is allowed to be added as a child node.
     * The {@link appendNode()} and {@link appendNodes()} functions use this to validate their
     * inputs.
     *
     * @virtual
     */
    DocNodeContainer.prototype.isAllowedChildNode = function (docNode) {
        return false;
    };
    /**
     * Append a node to the collection.
     */
    DocNodeContainer.prototype.appendNode = function (docNode) {
        if (!this.isAllowedChildNode(docNode)) {
            throw new Error("A " + this.kind + " cannot contain nodes of type " + docNode.kind);
        }
        this._nodes.push(docNode);
    };
    /**
     * Append nodes to the collection.
     */
    DocNodeContainer.prototype.appendNodes = function (docNodes) {
        for (var _i = 0, docNodes_1 = docNodes; _i < docNodes_1.length; _i++) {
            var docNode = docNodes_1[_i];
            this.appendNode(docNode);
        }
    };
    /**
     * Remove all nodes from the collection.
     */
    DocNodeContainer.prototype.clearNodes = function () {
        this._nodes.length = 0;
    };
    return DocNodeContainer;
}(DocNode_1.DocNode));
exports.DocNodeContainer = DocNodeContainer;
//# sourceMappingURL=DocNodeContainer.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocNodeLeaf.js":
/*!*****************************************!*\
  !*** ../tsdoc/lib/nodes/DocNodeLeaf.js ***!
  \*****************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
/**
 * Abstract base class for `DocNode` subclasses that correspond to input text,
 * i.e. can have an associated Excerpt object.
 */
var DocNodeLeaf = /** @class */ (function (_super) {
    __extends(DocNodeLeaf, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocNodeLeaf(parameters) {
        return _super.call(this, parameters) || this;
    }
    Object.defineProperty(DocNodeLeaf.prototype, "excerpt", {
        /**
         * If this DocNode was created by parsing an input, the `DocNode.excerpt`
         * property can be used to track the associated input text.  This can be useful
         * for highlighting matches during refactoring or highlighting error locations.
         */
        get: function () {
            return this._excerpt;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocNodeLeaf.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._excerpt = parameters.excerpt;
    };
    /**
     * Allows the DocNodeLeaf.excerpt to be updated after the object was constructed.
     */
    DocNodeLeaf.prototype.updateExcerpt = function (excerpt) {
        this._excerpt = excerpt;
    };
    return DocNodeLeaf;
}(DocNode_1.DocNode));
exports.DocNodeLeaf = DocNodeLeaf;
//# sourceMappingURL=DocNodeLeaf.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocParagraph.js":
/*!******************************************!*\
  !*** ../tsdoc/lib/nodes/DocParagraph.js ***!
  \******************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNodeContainer_1 = __webpack_require__(/*! ./DocNodeContainer */ "../tsdoc/lib/nodes/DocNodeContainer.js");
/**
 * Represents a paragraph of text, similar to a `<p>` element in HTML.
 * Like CommonMark, the TSDoc syntax uses blank lines to delineate paragraphs
 * instead of explicitly notating them.
 */
var DocParagraph = /** @class */ (function (_super) {
    __extends(DocParagraph, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocParagraph(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "Paragraph" /* Paragraph */;
        return _this;
    }
    /**
     * {@inheritDoc}
     * @override
     */
    DocParagraph.prototype.isAllowedChildNode = function (docNode) {
        // NOTE: DocNodeKind.Paragraph cannot be nested
        switch (docNode.kind) {
            case "BlockTag" /* BlockTag */:
            case "CodeSpan" /* CodeSpan */:
            case "ErrorText" /* ErrorText */:
            case "EscapedText" /* EscapedText */:
            case "HtmlStartTag" /* HtmlStartTag */:
            case "HtmlEndTag" /* HtmlEndTag */:
            case "InlineTag" /* InlineTag */:
            case "LinkTag" /* LinkTag */:
            case "PlainText" /* PlainText */:
            case "SoftBreak" /* SoftBreak */:
                return true;
        }
        return false;
    };
    return DocParagraph;
}(DocNodeContainer_1.DocNodeContainer));
exports.DocParagraph = DocParagraph;
//# sourceMappingURL=DocParagraph.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocParamBlock.js":
/*!*******************************************!*\
  !*** ../tsdoc/lib/nodes/DocParamBlock.js ***!
  \*******************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocBlock_1 = __webpack_require__(/*! ./DocBlock */ "../tsdoc/lib/nodes/DocBlock.js");
var DocParticle_1 = __webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js");
/**
 * Represents a parsed `@param` or `@typeParam` block, which provides a description for a
 * function parameter.
 */
var DocParamBlock = /** @class */ (function (_super) {
    __extends(DocParamBlock, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocParamBlock(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "ParamBlock" /* ParamBlock */;
        return _this;
    }
    Object.defineProperty(DocParamBlock.prototype, "parameterName", {
        /**
         * The name of the parameter that is being documented.
         * For example "width" in `@param width - the width of the object`.
         */
        get: function () {
            return this._parameterNameParticle.content;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocParamBlock.prototype.updateParameters = function (parameters) {
        _super.prototype.updateParameters.call(this, parameters);
        this._parameterNameParticle = new DocParticle_1.DocParticle({
            particleId: 'parameterName',
            excerpt: parameters.parameterNameExcerpt,
            content: parameters.parameterName
        });
        this._hyphenParticle = new DocParticle_1.DocParticle({
            particleId: 'hyphen',
            excerpt: parameters.hyphenExcerpt,
            content: '-'
        });
    };
    /**
     * {@inheritDoc}
     * @override
     */
    DocParamBlock.prototype.getChildNodes = function () {
        return [
            this.blockTag,
            this._parameterNameParticle,
            this._hyphenParticle
        ].concat(this.nodes);
    };
    return DocParamBlock;
}(DocBlock_1.DocBlock));
exports.DocParamBlock = DocParamBlock;
//# sourceMappingURL=DocParamBlock.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocParticle.js":
/*!*****************************************!*\
  !*** ../tsdoc/lib/nodes/DocParticle.js ***!
  \*****************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNode_1 = __webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js");
var DocNodeLeaf_1 = __webpack_require__(/*! ./DocNodeLeaf */ "../tsdoc/lib/nodes/DocNodeLeaf.js");
/**
 * DocParticle is used to represent additional generic nodes that are part of the
 * DocNode tree, for the purpose of providing additional Excerpt information.
 *
 * @remarks
 * For example, a DocHtmlAttribute has a "=" delimiter and a quoted text string
 * that may be interesting to highlight in an editor; however, it would be awkward
 * to expect developers to construct these nodes as part of constructing a
 * DocHtmlAttribute object.  Instead, the developer merely assigns
 * DocHtmlAttribute.attributeValue, and the particle nodes automatically appear
 * in the tree as a byproduct.  And rather than introducing lots of special-purpose
 * types (e.g. DocHtmlAttributeEqualsDelimiter or DocHtmlAttributeStringValue),
 * they are represented as generic "DocParticle" nodes.
 */
var DocParticle = /** @class */ (function (_super) {
    __extends(DocParticle, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocParticle(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "Particle" /* Particle */;
        return _this;
    }
    Object.defineProperty(DocParticle.prototype, "particleId", {
        /**
         * A string identifier that uniquely identifies a particle among its siblings.
         * This can be used by DocNode.getChildren() visitors to determine what the particle
         * represents.
         */
        get: function () {
            return this._particleId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocParticle.prototype, "content", {
        /**
         * The text representation of this particle, excluding any surrounding whitespace.
         */
        get: function () {
            return this._content;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocParticle.prototype, "spacingAfterContent", {
        /**
         * Optional explicit whitespace that appears after the main content.
         * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
         */
        get: function () {
            return this._spacingAfterContent;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocParticle.prototype.updateParameters = function (parameters) {
        DocNode_1.DocNode.validateSpacing(parameters.spacingAfterContent, 'spacingAfterContent');
        if (this._particleId && parameters.particleId !== this._particleId) {
            throw new Error('The particleId cannot be changed using updateParameters()');
        }
        _super.prototype.updateParameters.call(this, parameters);
        this._particleId = parameters.particleId;
        this._content = parameters.content;
        this._spacingAfterContent = parameters.spacingAfterContent;
    };
    return DocParticle;
}(DocNodeLeaf_1.DocNodeLeaf));
exports.DocParticle = DocParticle;
//# sourceMappingURL=DocParticle.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocPlainText.js":
/*!******************************************!*\
  !*** ../tsdoc/lib/nodes/DocPlainText.js ***!
  \******************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNodeLeaf_1 = __webpack_require__(/*! ./DocNodeLeaf */ "../tsdoc/lib/nodes/DocNodeLeaf.js");
/**
 * Represents a span of comment text that is considered by the parser
 * to contain no special symbols or meaning.
 *
 * @remarks
 * The text content must not contain newline characters.
 * Use DocSoftBreak to represent manual line splitting.
 */
var DocPlainText = /** @class */ (function (_super) {
    __extends(DocPlainText, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocPlainText(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "PlainText" /* PlainText */;
        return _this;
    }
    Object.defineProperty(DocPlainText.prototype, "text", {
        /**
         * The text content.
         */
        get: function () {
            return this._text;
        },
        enumerable: true,
        configurable: true
    });
    /** @override */
    DocPlainText.prototype.updateParameters = function (parameters) {
        if (DocPlainText._newlineCharacterRegExp.test(parameters.text)) {
            // Use DocSoftBreak to represent manual line splitting
            throw new Error('The DocPlainText content must not contain newline characters');
        }
        _super.prototype.updateParameters.call(this, parameters);
        this._text = parameters.text;
    };
    // TODO: We should also prohibit "\r", but this requires updating LineExtractor
    // to interpret a lone "\r" as a newline
    DocPlainText._newlineCharacterRegExp = /[\n]/;
    return DocPlainText;
}(DocNodeLeaf_1.DocNodeLeaf));
exports.DocPlainText = DocPlainText;
//# sourceMappingURL=DocPlainText.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocSection.js":
/*!****************************************!*\
  !*** ../tsdoc/lib/nodes/DocSection.js ***!
  \****************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocParagraph_1 = __webpack_require__(/*! ./DocParagraph */ "../tsdoc/lib/nodes/DocParagraph.js");
var DocNodeContainer_1 = __webpack_require__(/*! ./DocNodeContainer */ "../tsdoc/lib/nodes/DocNodeContainer.js");
/**
 * Represents a general block of rich text.  DocSection is the base class for DocNode classes that
 * act as a simple container for other child nodes.
 */
var DocSection = /** @class */ (function (_super) {
    __extends(DocSection, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocSection(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "Section" /* Section */;
        return _this;
    }
    /**
     * {@inheritDoc}
     * @override
     */
    DocSection.prototype.isAllowedChildNode = function (docNode) {
        switch (docNode.kind) {
            case "FencedCode" /* FencedCode */:
            case "ErrorText" /* ErrorText */:
            case "Paragraph" /* Paragraph */:
                return true;
        }
        return false;
    };
    /**
     * If the last item in DocSection.nodes is not a DocParagraph, a new paragraph
     * is started.  Either way, the provided docNode will be appended to the paragraph.
     */
    DocSection.prototype.appendNodeInParagraph = function (docNode) {
        var paragraphNode = undefined;
        if (this.nodes.length > 0) {
            var lastNode = this.nodes[this.nodes.length - 1];
            if (lastNode.kind === "Paragraph" /* Paragraph */) {
                paragraphNode = lastNode;
            }
        }
        if (!paragraphNode) {
            paragraphNode = new DocParagraph_1.DocParagraph({});
            this.appendNode(paragraphNode);
        }
        paragraphNode.appendNode(docNode);
    };
    return DocSection;
}(DocNodeContainer_1.DocNodeContainer));
exports.DocSection = DocSection;
//# sourceMappingURL=DocSection.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/DocSoftBreak.js":
/*!******************************************!*\
  !*** ../tsdoc/lib/nodes/DocSoftBreak.js ***!
  \******************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DocNodeLeaf_1 = __webpack_require__(/*! ./DocNodeLeaf */ "../tsdoc/lib/nodes/DocNodeLeaf.js");
/**
 * Instructs a renderer to insert an explicit newline in the output.
 * (Normally the renderer uses a formatting rule to determine where
 * lines should wrap.)
 *
 * @remarks
 * In HTML, a soft break is represented as an ASCII newline character (which does not
 * affect the web browser's view), whereas the hard break is the `<br />` element
 * (which starts a new line in the web browser's view).
 *
 * TSDoc follows the same conventions, except the renderer avoids emitting
 * two empty lines (because that could start a new CommonMark paragraph).
 */
var DocSoftBreak = /** @class */ (function (_super) {
    __extends(DocSoftBreak, _super);
    /**
     * Don't call this directly.  Instead use {@link TSDocParser}
     * @internal
     */
    function DocSoftBreak(parameters) {
        var _this = _super.call(this, parameters) || this;
        /** {@inheritDoc} */
        _this.kind = "SoftBreak" /* SoftBreak */;
        return _this;
    }
    return DocSoftBreak;
}(DocNodeLeaf_1.DocNodeLeaf));
exports.DocSoftBreak = DocSoftBreak;
//# sourceMappingURL=DocSoftBreak.js.map

/***/ }),

/***/ "../tsdoc/lib/nodes/index.js":
/*!***********************************!*\
  !*** ../tsdoc/lib/nodes/index.js ***!
  \***********************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./DocBlock */ "../tsdoc/lib/nodes/DocBlock.js"));
__export(__webpack_require__(/*! ./DocBlockTag */ "../tsdoc/lib/nodes/DocBlockTag.js"));
__export(__webpack_require__(/*! ./DocFencedCode */ "../tsdoc/lib/nodes/DocFencedCode.js"));
__export(__webpack_require__(/*! ./DocCodeSpan */ "../tsdoc/lib/nodes/DocCodeSpan.js"));
__export(__webpack_require__(/*! ./DocComment */ "../tsdoc/lib/nodes/DocComment.js"));
__export(__webpack_require__(/*! ./DocDeclarationReference */ "../tsdoc/lib/nodes/DocDeclarationReference.js"));
__export(__webpack_require__(/*! ./DocErrorText */ "../tsdoc/lib/nodes/DocErrorText.js"));
__export(__webpack_require__(/*! ./DocEscapedText */ "../tsdoc/lib/nodes/DocEscapedText.js"));
__export(__webpack_require__(/*! ./DocHtmlAttribute */ "../tsdoc/lib/nodes/DocHtmlAttribute.js"));
__export(__webpack_require__(/*! ./DocHtmlEndTag */ "../tsdoc/lib/nodes/DocHtmlEndTag.js"));
__export(__webpack_require__(/*! ./DocHtmlStartTag */ "../tsdoc/lib/nodes/DocHtmlStartTag.js"));
__export(__webpack_require__(/*! ./DocInlineTag */ "../tsdoc/lib/nodes/DocInlineTag.js"));
__export(__webpack_require__(/*! ./DocInheritDocTag */ "../tsdoc/lib/nodes/DocInheritDocTag.js"));
__export(__webpack_require__(/*! ./DocLinkTag */ "../tsdoc/lib/nodes/DocLinkTag.js"));
__export(__webpack_require__(/*! ./DocMemberIdentifier */ "../tsdoc/lib/nodes/DocMemberIdentifier.js"));
__export(__webpack_require__(/*! ./DocMemberReference */ "../tsdoc/lib/nodes/DocMemberReference.js"));
__export(__webpack_require__(/*! ./DocMemberSelector */ "../tsdoc/lib/nodes/DocMemberSelector.js"));
__export(__webpack_require__(/*! ./DocMemberSymbol */ "../tsdoc/lib/nodes/DocMemberSymbol.js"));
__export(__webpack_require__(/*! ./DocNode */ "../tsdoc/lib/nodes/DocNode.js"));
__export(__webpack_require__(/*! ./DocNodeContainer */ "../tsdoc/lib/nodes/DocNodeContainer.js"));
__export(__webpack_require__(/*! ./DocNodeLeaf */ "../tsdoc/lib/nodes/DocNodeLeaf.js"));
__export(__webpack_require__(/*! ./DocParagraph */ "../tsdoc/lib/nodes/DocParagraph.js"));
__export(__webpack_require__(/*! ./DocParamBlock */ "../tsdoc/lib/nodes/DocParamBlock.js"));
__export(__webpack_require__(/*! ./DocParticle */ "../tsdoc/lib/nodes/DocParticle.js"));
__export(__webpack_require__(/*! ./DocPlainText */ "../tsdoc/lib/nodes/DocPlainText.js"));
__export(__webpack_require__(/*! ./DocSection */ "../tsdoc/lib/nodes/DocSection.js"));
__export(__webpack_require__(/*! ./DocSoftBreak */ "../tsdoc/lib/nodes/DocSoftBreak.js"));
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/Excerpt.js":
/*!**************************************!*\
  !*** ../tsdoc/lib/parser/Excerpt.js ***!
  \**************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var TokenSequence_1 = __webpack_require__(/*! ./TokenSequence */ "../tsdoc/lib/parser/TokenSequence.js");
/**
 * When a DocNode is constructed by parsing input text, the Excerpt object is used to
 * annotate each node with the associated tokens that were parsed.  This is useful
 * e.g. for highlighting the corresponding input characters to indicate a refactoring
 * match or error location.
 *
 * @remarks
 * The excerpt is separated into two token sequences: The "content" sequence is
 * the main textual content for the node.  The "spacingAfterContent" optionally captures
 * following whitespace, in cases where that whitespace is not interesting.
 * (For example, it is not used with DocPlainText since spacing is part of the normal
 * plain text content.)
 */
var Excerpt = /** @class */ (function () {
    function Excerpt(parameters) {
        this.parserContext = parameters.content.parserContext;
        this.content = parameters.content;
        this.spacingAfterContent = parameters.spacingAfterContent || TokenSequence_1.TokenSequence.createEmpty(this.parserContext);
    }
    return Excerpt;
}());
exports.Excerpt = Excerpt;
//# sourceMappingURL=Excerpt.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/LineExtractor.js":
/*!********************************************!*\
  !*** ../tsdoc/lib/parser/LineExtractor.js ***!
  \********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// Internal parser state
var State;
(function (State) {
    // Initial state, looking for "/*"
    State[State["BeginComment1"] = 0] = "BeginComment1";
    // Looking for "*" or "* " after "/*"
    State[State["BeginComment2"] = 1] = "BeginComment2";
    // Like State.CollectingLine except immediately after the "/**"
    State[State["CollectingFirstLine"] = 2] = "CollectingFirstLine";
    // Collecting characters until we reach a newline
    State[State["CollectingLine"] = 3] = "CollectingLine";
    // After a newline, looking for the "*" that begins a new line, or the "*/" to end the comment
    State[State["AdvancingLine"] = 4] = "AdvancingLine";
    // Exiting the parser loop
    State[State["Done"] = 5] = "Done";
})(State || (State = {}));
/**
 * The main API for parsing TSDoc comments.
 */
var LineExtractor = /** @class */ (function () {
    function LineExtractor() {
    }
    /**
     * This step parses an entire code comment from slash-star-star until star-slash,
     * and extracts the content lines.  The lines are stored in IDocCommentParameters.lines
     * and the overall text range is assigned to IDocCommentParameters.range.
     */
    LineExtractor.extract = function (parserContext) {
        var range = parserContext.sourceRange;
        var buffer = range.buffer;
        var commentRangeStart = 0;
        var commentRangeEnd = 0;
        // These must be set before entering CollectingFirstLine, CollectingLine, or AdvancingLine
        var collectingLineStart = 0;
        var collectingLineEnd = 0;
        var nextIndex = range.pos;
        var state = State.BeginComment1;
        var lines = [];
        while (state !== State.Done) {
            if (nextIndex >= range.end) {
                // reached the end of the input
                switch (state) {
                    case State.BeginComment1:
                    case State.BeginComment2:
                        parserContext.log.addMessageForTextRange('Expecting a "/**" comment', range);
                        return false;
                    default:
                        parserContext.log.addMessageForTextRange('Unexpected end of input', range);
                        return false;
                }
            }
            var current = buffer[nextIndex];
            var currentIndex = nextIndex;
            ++nextIndex;
            var next = nextIndex < range.end ? buffer[nextIndex] : '';
            switch (state) {
                case State.BeginComment1:
                    if (current === '/' && next === '*') {
                        commentRangeStart = currentIndex;
                        ++nextIndex; // skip the star
                        state = State.BeginComment2;
                    }
                    else if (!LineExtractor._whitespaceCharacterRegExp.test(current)) {
                        parserContext.log.addMessageForTextRange('Expecting a leading "/**"', range.getNewRange(currentIndex, currentIndex + 1));
                        return false;
                    }
                    break;
                case State.BeginComment2:
                    if (current === '*') {
                        if (next === ' ') {
                            ++nextIndex; // Discard the space after the star
                        }
                        collectingLineStart = nextIndex;
                        collectingLineEnd = nextIndex;
                        state = State.CollectingFirstLine;
                    }
                    else {
                        parserContext.log.addMessageForTextRange('Expecting a leading "/**"', range.getNewRange(currentIndex, currentIndex + 1));
                        return false;
                    }
                    break;
                case State.CollectingFirstLine:
                case State.CollectingLine:
                    if (current === '\n') {
                        // Ignore an empty line if it is immediately after the "/**"
                        if (state !== State.CollectingFirstLine || collectingLineEnd > collectingLineStart) {
                            // Record the line that we collected
                            lines.push(range.getNewRange(collectingLineStart, collectingLineEnd));
                        }
                        collectingLineStart = nextIndex;
                        collectingLineEnd = nextIndex;
                        state = State.AdvancingLine;
                    }
                    else if (current === '*' && next === '/') {
                        if (collectingLineEnd > collectingLineStart) {
                            lines.push(range.getNewRange(collectingLineStart, collectingLineEnd));
                        }
                        collectingLineStart = 0;
                        collectingLineEnd = 0;
                        ++nextIndex; // skip the slash
                        commentRangeEnd = nextIndex;
                        state = State.Done;
                    }
                    else if (!LineExtractor._whitespaceCharacterRegExp.test(current)) {
                        collectingLineEnd = nextIndex;
                    }
                    break;
                case State.AdvancingLine:
                    if (current === '*') {
                        if (next === '/') {
                            collectingLineStart = 0;
                            collectingLineEnd = 0;
                            ++nextIndex; // skip the slash
                            commentRangeEnd = nextIndex;
                            state = State.Done;
                        }
                        else {
                            // Discard the "*" at the start of a line
                            if (next === ' ') {
                                ++nextIndex; // Discard the space after the star
                            }
                            collectingLineStart = nextIndex;
                            collectingLineEnd = nextIndex;
                            state = State.CollectingLine;
                        }
                    }
                    else if (current === '\n') {
                        // Blank line
                        lines.push(range.getNewRange(currentIndex, currentIndex));
                        collectingLineStart = nextIndex;
                    }
                    else if (!LineExtractor._whitespaceCharacterRegExp.test(current)) {
                        // If the star is missing, then start the line here
                        // Example: "/**\nL1*/"
                        // (collectingLineStart was the start of this line)
                        collectingLineEnd = currentIndex;
                        state = State.CollectingLine;
                    }
                    break;
            }
        }
        /**
         * Only fill in these if we successfully scanned a comment
         */
        parserContext.commentRange = range.getNewRange(commentRangeStart, commentRangeEnd);
        parserContext.lines = lines;
        return true;
    };
    LineExtractor._whitespaceCharacterRegExp = /^\s$/;
    return LineExtractor;
}());
exports.LineExtractor = LineExtractor;
//# sourceMappingURL=LineExtractor.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/NodeParser.js":
/*!*****************************************!*\
  !*** ../tsdoc/lib/parser/NodeParser.js ***!
  \*****************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Token_1 = __webpack_require__(/*! ./Token */ "../tsdoc/lib/parser/Token.js");
var Tokenizer_1 = __webpack_require__(/*! ./Tokenizer */ "../tsdoc/lib/parser/Tokenizer.js");
var nodes_1 = __webpack_require__(/*! ../nodes */ "../tsdoc/lib/nodes/index.js");
var TokenSequence_1 = __webpack_require__(/*! ./TokenSequence */ "../tsdoc/lib/parser/TokenSequence.js");
var Excerpt_1 = __webpack_require__(/*! ./Excerpt */ "../tsdoc/lib/parser/Excerpt.js");
var TokenReader_1 = __webpack_require__(/*! ./TokenReader */ "../tsdoc/lib/parser/TokenReader.js");
var StringChecks_1 = __webpack_require__(/*! ./StringChecks */ "../tsdoc/lib/parser/StringChecks.js");
var TSDocTagDefinition_1 = __webpack_require__(/*! ./TSDocTagDefinition */ "../tsdoc/lib/parser/TSDocTagDefinition.js");
var StandardTags_1 = __webpack_require__(/*! ../details/StandardTags */ "../tsdoc/lib/details/StandardTags.js");
var PlainTextRenderer_1 = __webpack_require__(/*! ../renderers/PlainTextRenderer */ "../tsdoc/lib/renderers/PlainTextRenderer.js");
function isFailure(resultOrFailure) {
    return resultOrFailure !== undefined && resultOrFailure.hasOwnProperty('failureMessage');
}
/**
 * The main parser for TSDoc comments.
 */
var NodeParser = /** @class */ (function () {
    function NodeParser(parserContext) {
        this._parserContext = parserContext;
        this._currentSection = parserContext.docComment.summarySection;
    }
    NodeParser.prototype.parse = function () {
        var tokenReader = new TokenReader_1.TokenReader(this._parserContext);
        var done = false;
        while (!done) {
            // Extract the next token
            switch (tokenReader.peekTokenKind()) {
                case Token_1.TokenKind.EndOfInput:
                    done = true;
                    break;
                case Token_1.TokenKind.Newline:
                    this._pushAccumulatedPlainText(tokenReader);
                    tokenReader.readToken();
                    this._pushParagraphNode(new nodes_1.DocSoftBreak({
                        excerpt: new Excerpt_1.Excerpt({ content: tokenReader.extractAccumulatedSequence() })
                    }));
                    break;
                case Token_1.TokenKind.Backslash:
                    this._pushAccumulatedPlainText(tokenReader);
                    this._pushParagraphNode(this._parseBackslashEscape(tokenReader));
                    break;
                case Token_1.TokenKind.AtSign:
                    this._pushAccumulatedPlainText(tokenReader);
                    this._parseAndPushBlock(tokenReader);
                    break;
                case Token_1.TokenKind.LeftCurlyBracket: {
                    this._pushAccumulatedPlainText(tokenReader);
                    var marker = tokenReader.createMarker();
                    var docNode = this._parseInlineTag(tokenReader);
                    var docComment = this._parserContext.docComment;
                    if (docNode instanceof nodes_1.DocInheritDocTag) {
                        // The @inheritDoc tag is irregular because it looks like an inline tag, but
                        // it actually represents the entire comment body
                        var tagEndMarker = tokenReader.createMarker() - 1;
                        if (docComment.inheritDocTag === undefined) {
                            this._parserContext.docComment.inheritDocTag = docNode;
                        }
                        else {
                            this._pushParagraphNode(this._backtrackAndCreateErrorRange(tokenReader, marker, tagEndMarker, 'A doc comment cannot have more than one @inheritDoc tag'));
                        }
                    }
                    else {
                        this._pushParagraphNode(docNode);
                    }
                    break;
                }
                case Token_1.TokenKind.RightCurlyBracket:
                    this._pushAccumulatedPlainText(tokenReader);
                    this._pushParagraphNode(this._createError(tokenReader, 'The "}" character should be escaped using a backslash to avoid confusion with a TSDoc inline tag'));
                    break;
                case Token_1.TokenKind.LessThan:
                    this._pushAccumulatedPlainText(tokenReader);
                    // Look ahead two tokens to see if this is "<a>" or "</a>".
                    if (tokenReader.peekTokenAfterKind() === Token_1.TokenKind.Slash) {
                        this._pushParagraphNode(this._parseHtmlEndTag(tokenReader));
                    }
                    else {
                        this._pushParagraphNode(this._parseHtmlStartTag(tokenReader));
                    }
                    break;
                case Token_1.TokenKind.GreaterThan:
                    this._pushAccumulatedPlainText(tokenReader);
                    this._pushParagraphNode(this._createError(tokenReader, 'The ">" character should be escaped using a backslash to avoid confusion with an HTML tag'));
                    break;
                case Token_1.TokenKind.Backtick:
                    this._pushAccumulatedPlainText(tokenReader);
                    if (tokenReader.peekTokenAfterKind() === Token_1.TokenKind.Backtick
                        && tokenReader.peekTokenAfterAfterKind() === Token_1.TokenKind.Backtick) {
                        this._pushSectionNode(this._parseFencedCode(tokenReader));
                    }
                    else {
                        this._pushParagraphNode(this._parseCodeSpan(tokenReader));
                    }
                    break;
                default:
                    // If nobody recognized this token, then accumulate plain text
                    tokenReader.readToken();
                    break;
            }
        }
        this._pushAccumulatedPlainText(tokenReader);
        this._performValidationChecks();
    };
    NodeParser.prototype._performValidationChecks = function () {
        var docComment = this._parserContext.docComment;
        if (docComment.deprecatedBlock) {
            if (!PlainTextRenderer_1.PlainTextRenderer.hasAnyTextContent(docComment.deprecatedBlock)) {
                this._parserContext.log.addMessageForTokenSequence("The " + docComment.deprecatedBlock.blockTag.tagName + " block must include a deprecation message,"
                    + " e.g. describing the recommended alternative", docComment.deprecatedBlock.blockTag.excerpt.content, docComment.deprecatedBlock);
            }
        }
        if (docComment.inheritDocTag) {
            if (docComment.remarksBlock) {
                this._parserContext.log.addMessageForTokenSequence("A \"" + docComment.remarksBlock.blockTag.tagName + "\" block must not be used, because that"
                    + " content is provided by the @inheritDoc tag", docComment.remarksBlock.blockTag.excerpt.content, docComment.remarksBlock.blockTag);
            }
            if (PlainTextRenderer_1.PlainTextRenderer.hasAnyTextContent(docComment.summarySection)) {
                this._parserContext.log.addMessageForTextRange('The summary section must not have any content, because that'
                    + ' content is provided by the @inheritDoc tag', this._parserContext.commentRange);
            }
        }
    };
    NodeParser.prototype._validateTagDefinition = function (tagDefinition, tagName, expectingInlineTag, tokenSequenceForErrorContext, nodeForErrorContext) {
        if (tagDefinition) {
            var isInlineTag = tagDefinition.syntaxKind === TSDocTagDefinition_1.TSDocTagSyntaxKind.InlineTag;
            if (isInlineTag !== expectingInlineTag) {
                // The tag is defined, but it is used incorrectly
                if (expectingInlineTag) {
                    this._parserContext.log.addMessageForTokenSequence("The TSDoc tag \"" + tagName + "\" is an inline tag; it must be enclosed in \"{ }\" braces", tokenSequenceForErrorContext, nodeForErrorContext);
                }
                else {
                    this._parserContext.log.addMessageForTokenSequence("The TSDoc tag \"" + tagName + "\" is not an inline tag; it must not be enclosed in \"{ }\" braces", tokenSequenceForErrorContext, nodeForErrorContext);
                }
            }
            else {
                if (this._parserContext.configuration.validation.reportUnsupportedTags) {
                    if (!this._parserContext.configuration.isTagSupported(tagDefinition)) {
                        // The tag is defined, but not supported
                        this._parserContext.log.addMessageForTokenSequence("The TSDoc tag \"" + tagName + "\" is not supported by this tool", tokenSequenceForErrorContext, nodeForErrorContext);
                    }
                }
            }
        }
        else {
            // The tag is not defined
            if (!this._parserContext.configuration.validation.ignoreUndefinedTags) {
                this._parserContext.log.addMessageForTokenSequence("The TSDoc tag \"" + tagName + "\" is not defined in this configuration", tokenSequenceForErrorContext, nodeForErrorContext);
            }
        }
    };
    NodeParser.prototype._pushAccumulatedPlainText = function (tokenReader) {
        if (!tokenReader.isAccumulatedSequenceEmpty()) {
            var plainTextSequence = tokenReader.extractAccumulatedSequence();
            this._pushParagraphNode(new nodes_1.DocPlainText({
                text: plainTextSequence.toString(),
                excerpt: new Excerpt_1.Excerpt({ content: plainTextSequence })
            }));
        }
    };
    NodeParser.prototype._parseAndPushBlock = function (tokenReader) {
        var docComment = this._parserContext.docComment;
        var configuration = this._parserContext.configuration;
        var modifierTagSet = docComment.modifierTagSet;
        var parsedBlockTag = this._parseBlockTag(tokenReader);
        if (parsedBlockTag.kind !== "BlockTag" /* BlockTag */) {
            this._pushParagraphNode(parsedBlockTag);
            return;
        }
        var docBlockTag = parsedBlockTag;
        // Do we have a definition for this tag?
        var tagDefinition = configuration.tryGetTagDefinitionWithUpperCase(docBlockTag.tagNameWithUpperCase);
        this._validateTagDefinition(tagDefinition, docBlockTag.tagName, /* expectingInlineTag */ false, docBlockTag.excerpt.content, docBlockTag);
        if (tagDefinition) {
            switch (tagDefinition.syntaxKind) {
                case TSDocTagDefinition_1.TSDocTagSyntaxKind.BlockTag:
                    if (docBlockTag.tagNameWithUpperCase === StandardTags_1.StandardTags.param.tagNameWithUpperCase) {
                        var docParamBlock = this._parseParamBlock(tokenReader, docBlockTag);
                        this._parserContext.docComment.paramBlocks.push(docParamBlock);
                        this._currentSection = docParamBlock;
                        return;
                    }
                    else if (docBlockTag.tagNameWithUpperCase === StandardTags_1.StandardTags.typeParam.tagNameWithUpperCase) {
                        var docParamBlock = this._parseParamBlock(tokenReader, docBlockTag);
                        this._parserContext.docComment.typeParamBlocks.push(docParamBlock);
                        this._currentSection = docParamBlock;
                        return;
                    }
                    else {
                        var newBlock = new nodes_1.DocBlock({
                            blockTag: docBlockTag
                        });
                        this._addBlockToDocComment(newBlock);
                        this._currentSection = newBlock;
                    }
                    return;
                case TSDocTagDefinition_1.TSDocTagSyntaxKind.ModifierTag:
                    // The block tag was recognized as a modifier, so add it to the modifier tag set
                    // and do NOT call currentSection.appendNode(parsedNode)
                    modifierTagSet.addTag(docBlockTag);
                    return;
            }
        }
        this._pushParagraphNode(docBlockTag);
    };
    NodeParser.prototype._addBlockToDocComment = function (block) {
        var docComment = this._parserContext.docComment;
        switch (block.blockTag.tagNameWithUpperCase) {
            case StandardTags_1.StandardTags.remarks.tagNameWithUpperCase:
                docComment.remarksBlock = block;
                break;
            case StandardTags_1.StandardTags.privateRemarks.tagNameWithUpperCase:
                docComment.privateRemarks = block;
                break;
            case StandardTags_1.StandardTags.deprecated.tagNameWithUpperCase:
                docComment.deprecatedBlock = block;
                break;
            case StandardTags_1.StandardTags.returns.tagNameWithUpperCase:
                docComment.returnsBlock = block;
                break;
            default:
                docComment.appendCustomBlock(block);
        }
    };
    NodeParser.prototype._parseParamBlock = function (tokenReader, docBlockTag) {
        var startMarker = tokenReader.createMarker();
        this._readSpacingAndNewlines(tokenReader);
        var leadingWhitespaceSequence = tokenReader.tryExtractAccumulatedSequence();
        var parameterName = '';
        var done = false;
        while (!done) {
            switch (tokenReader.peekTokenKind()) {
                case Token_1.TokenKind.AsciiWord:
                case Token_1.TokenKind.Period:
                    parameterName += tokenReader.readToken();
                    break;
                default:
                    done = true;
                    break;
            }
        }
        if (parameterName.length === 0) {
            tokenReader.backtrackToMarker(startMarker);
            var errorParamBlock = new nodes_1.DocParamBlock({
                blockTag: docBlockTag,
                parameterName: ''
            });
            this._parserContext.log.addMessageForTokenSequence('The @param block should be followed by a parameter name', docBlockTag.excerpt.content, docBlockTag);
            return errorParamBlock;
        }
        var parameterNameExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        // TODO: Warn if there is no space before or after the hyphen
        this._readSpacingAndNewlines(tokenReader);
        parameterNameExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.Hyphen) {
            tokenReader.backtrackToMarker(startMarker);
            this._parserContext.log.addMessageForTokenSequence('The @param block should be followed by a parameter name and then a hyphen', docBlockTag.excerpt.content, docBlockTag);
            return new nodes_1.DocParamBlock({
                blockTag: docBlockTag,
                parameterName: ''
            });
        }
        tokenReader.readToken();
        var hyphenExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        // TODO: Only read one space
        this._readSpacingAndNewlines(tokenReader);
        hyphenExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
        if (leadingWhitespaceSequence) {
            // The leading whitespace that we parsed to the docBlockTag
            docBlockTag.updateExcerpt(new Excerpt_1.Excerpt({
                content: docBlockTag.excerpt.content,
                spacingAfterContent: leadingWhitespaceSequence
            }));
        }
        return new nodes_1.DocParamBlock({
            blockTag: docBlockTag,
            parameterNameExcerpt: new Excerpt_1.Excerpt(parameterNameExcerptParameters),
            parameterName: parameterName,
            hyphenExcerpt: new Excerpt_1.Excerpt(hyphenExcerptParameters)
        });
    };
    NodeParser.prototype._pushParagraphNode = function (docNode) {
        this._currentSection.appendNodeInParagraph(docNode);
    };
    NodeParser.prototype._pushSectionNode = function (docNode) {
        this._currentSection.appendNode(docNode);
    };
    NodeParser.prototype._parseBackslashEscape = function (tokenReader) {
        tokenReader.assertAccumulatedSequenceIsEmpty();
        var marker = tokenReader.createMarker();
        tokenReader.readToken();
        if (tokenReader.peekTokenKind() === Token_1.TokenKind.EndOfInput) {
            return this._backtrackAndCreateError(tokenReader, marker, 'A backslash must precede another character that is being escaped');
        }
        var escapedToken = tokenReader.readToken();
        // In CommonMark, a backslash is only allowed before a punctuation
        // character.  In all other contexts, the backslash is interpreted as a
        // literal character.
        if (!Tokenizer_1.Tokenizer.isPunctuation(escapedToken.kind)) {
            return this._backtrackAndCreateError(tokenReader, marker, 'A backslash can only be used to escape a punctuation character');
        }
        var tokenSequence = tokenReader.extractAccumulatedSequence();
        return new nodes_1.DocEscapedText({
            excerpt: new Excerpt_1.Excerpt({ content: tokenSequence }),
            escapeStyle: nodes_1.EscapeStyle.CommonMarkBackslash,
            text: escapedToken.toString()
        });
    };
    NodeParser.prototype._parseBlockTag = function (tokenReader) {
        tokenReader.assertAccumulatedSequenceIsEmpty();
        var marker = tokenReader.createMarker();
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.AtSign) {
            return this._backtrackAndCreateError(tokenReader, marker, 'Expecting a TSDoc tag starting with "@"');
        }
        // "@one" is a valid TSDoc tag at the start of a line, but "@one@two" is
        // a syntax error.  For two tags it should be "@one @two", or for literal text it
        // should be "\@one\@two".
        switch (tokenReader.peekPreviousTokenKind()) {
            case Token_1.TokenKind.EndOfInput:
            case Token_1.TokenKind.Spacing:
            case Token_1.TokenKind.Newline:
                break;
            default:
                return this._backtrackAndCreateError(tokenReader, marker, 'A TSDoc tag must be preceded by whitespace');
        }
        // Include the "@" as part of the tagName
        var tagName = tokenReader.readToken().toString();
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.AsciiWord) {
            return this._backtrackAndCreateError(tokenReader, marker, 'Expecting a TSDoc tag name after the "@" character (or use a backslash to escape this character)');
        }
        var tagNameMarker = tokenReader.createMarker();
        while (tokenReader.peekTokenKind() === Token_1.TokenKind.AsciiWord) {
            tagName += tokenReader.readToken().toString();
        }
        if (tagName.length === 0) {
            return this._backtrackAndCreateError(tokenReader, marker, 'Expecting an inline TSDoc tag name immediately after "{@"');
        }
        if (StringChecks_1.StringChecks.explainIfInvalidTSDocTagName(tagName)) {
            var failure = this._createFailureForTokensSince(tokenReader, 'A TSDoc tag name must start with a letter and contain only letters and numbers', tagNameMarker);
            return this._backtrackAndCreateErrorForFailure(tokenReader, marker, '', failure);
        }
        switch (tokenReader.peekTokenKind()) {
            case Token_1.TokenKind.Spacing:
            case Token_1.TokenKind.Newline:
            case Token_1.TokenKind.EndOfInput:
                break;
            default:
                return this._backtrackAndCreateError(tokenReader, marker, 'A TSDoc tag must be followed by whitespace');
        }
        return new nodes_1.DocBlockTag({
            excerpt: new Excerpt_1.Excerpt({ content: tokenReader.extractAccumulatedSequence() }),
            tagName: tagName
        });
    };
    NodeParser.prototype._parseInlineTag = function (tokenReader) {
        tokenReader.assertAccumulatedSequenceIsEmpty();
        var marker = tokenReader.createMarker();
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.LeftCurlyBracket) {
            return this._backtrackAndCreateError(tokenReader, marker, 'Expecting a TSDoc tag starting with "{"');
        }
        tokenReader.readToken();
        var openingDelimiterExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        // For inline tags, if we handle errors by backtracking to the "{"  token, then the main loop
        // will then interpret the "@" as a block tag, which is almost certainly incorrect.  So the
        // DocErrorText needs to include both the "{" and "@" tokens.
        // We will use _backtrackAndCreateErrorRangeForFailure() for that.
        var atSignMarker = tokenReader.createMarker();
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.AtSign) {
            return this._backtrackAndCreateError(tokenReader, marker, 'Expecting a TSDoc tag starting with "{@"');
        }
        // Include the "@" as part of the tagName
        var tagName = tokenReader.readToken().toString();
        while (tokenReader.peekTokenKind() === Token_1.TokenKind.AsciiWord) {
            tagName += tokenReader.readToken().toString();
        }
        if (tagName === '@') {
            // This is an unusual case
            var failure = this._createFailureForTokensSince(tokenReader, 'Expecting a TSDoc inline tag name after the "{@" characters', atSignMarker);
            return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
        }
        if (StringChecks_1.StringChecks.explainIfInvalidTSDocTagName(tagName)) {
            var failure = this._createFailureForTokensSince(tokenReader, 'A TSDoc tag name must start with a letter and contain only letters and numbers', atSignMarker);
            return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
        }
        var tagNameExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        var spacingAfterTagName = this._readSpacingAndNewlines(tokenReader);
        tagNameExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
        if (spacingAfterTagName.length === 0) {
            // If there were no spaces at all, that's an error unless it's the degenerate "{@tag}" case
            if (tokenReader.peekTokenKind() !== Token_1.TokenKind.RightCurlyBracket) {
                var failure = this._createFailureForToken(tokenReader, 'Expecting a space after the TSDoc inline tag name');
                return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
            }
        }
        var tagContent = '';
        var done = false;
        while (!done) {
            switch (tokenReader.peekTokenKind()) {
                case Token_1.TokenKind.EndOfInput:
                    return this._backtrackAndCreateErrorRange(tokenReader, marker, atSignMarker, 'The TSDoc inline tag name is missing its closing "}"');
                case Token_1.TokenKind.Backslash:
                    // http://usejsdoc.org/about-block-inline-tags.html
                    // "If your tag's text includes a closing curly brace (}), you must escape it with
                    // a leading backslash (\)."
                    tokenReader.readToken(); // discard the backslash
                    // In CommonMark, a backslash is only allowed before a punctuation
                    // character.  In all other contexts, the backslash is interpreted as a
                    // literal character.
                    if (!Tokenizer_1.Tokenizer.isPunctuation(tokenReader.peekTokenKind())) {
                        var failure = this._createFailureForToken(tokenReader, 'A backslash can only be used to escape a punctuation character');
                        return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, 'Error reading inline TSDoc tag: ', failure);
                    }
                    tagContent += tokenReader.readToken().toString();
                    break;
                case Token_1.TokenKind.LeftCurlyBracket:
                    {
                        var failure = this._createFailureForToken(tokenReader, 'The "{" character must be escaped with a backslash when used inside a TSDoc inline tag');
                        return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
                    }
                case Token_1.TokenKind.RightCurlyBracket:
                    done = true;
                    break;
                default:
                    tagContent += tokenReader.readToken().toString();
                    break;
            }
        }
        var tagContentExcerpt;
        if (!tokenReader.isAccumulatedSequenceEmpty()) {
            tagContentExcerpt = new Excerpt_1.Excerpt({
                content: tokenReader.extractAccumulatedSequence()
            });
        }
        // Read the right curly bracket
        tokenReader.readToken();
        var closingDelimiterExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        var docInlineTagParameters = {
            openingDelimiterExcerpt: new Excerpt_1.Excerpt(openingDelimiterExcerptParameters),
            tagNameExcerpt: new Excerpt_1.Excerpt(tagNameExcerptParameters),
            tagName: tagName,
            tagContentExcerpt: tagContentExcerpt,
            tagContent: tagContent,
            closingDelimiterExcerpt: new Excerpt_1.Excerpt(closingDelimiterExcerptParameters)
        };
        var tagNameWithUpperCase = tagName.toUpperCase();
        // Create a new TokenReader that will reparse the tokens corresponding to the tagContent.
        var embeddedTokenReader = new TokenReader_1.TokenReader(this._parserContext, tagContentExcerpt ? tagContentExcerpt.content : TokenSequence_1.TokenSequence.createEmpty(this._parserContext));
        var docNode;
        switch (tagNameWithUpperCase) {
            case StandardTags_1.StandardTags.inheritDoc.tagNameWithUpperCase:
                docNode = this._parseInheritDocTag(docInlineTagParameters, embeddedTokenReader);
                break;
            case StandardTags_1.StandardTags.link.tagNameWithUpperCase:
                docNode = this._parseLinkTag(docInlineTagParameters, embeddedTokenReader);
                break;
            default:
                docNode = new nodes_1.DocInlineTag(docInlineTagParameters);
        }
        // Validate the tag
        var tagDefinition = this._parserContext.configuration.tryGetTagDefinitionWithUpperCase(tagNameWithUpperCase);
        this._validateTagDefinition(tagDefinition, tagName, /* expectingInlineTag */ true, tagNameExcerptParameters.content, docNode);
        return docNode;
    };
    NodeParser.prototype._parseInheritDocTag = function (docInlineTagParameters, embeddedTokenReader) {
        var docInheritDocTag = new nodes_1.DocInheritDocTag(docInlineTagParameters);
        var parameters = __assign({}, docInlineTagParameters);
        if (embeddedTokenReader.peekTokenKind() !== Token_1.TokenKind.EndOfInput) {
            parameters.declarationReference = this._parseDeclarationReference(embeddedTokenReader, docInlineTagParameters.tagNameExcerpt.content, docInheritDocTag);
            if (!parameters.declarationReference) {
                return docInheritDocTag; // error
            }
            if (embeddedTokenReader.peekTokenKind() !== Token_1.TokenKind.EndOfInput) {
                embeddedTokenReader.readToken();
                this._parserContext.log.addMessageForTokenSequence('Unexpected character after declaration reference', embeddedTokenReader.extractAccumulatedSequence(), docInheritDocTag);
                return docInheritDocTag; // error
            }
        }
        // We don't need the tagContentExcerpt since those tokens are now associated with the link particles
        parameters.tagContentExcerpt = undefined;
        docInheritDocTag.updateParameters(parameters);
        return docInheritDocTag;
    };
    NodeParser.prototype._parseLinkTag = function (docInlineTagParameters, embeddedTokenReader) {
        var docLinkTag = new nodes_1.DocLinkTag(docInlineTagParameters);
        var parameters = __assign({}, docInlineTagParameters);
        if (!parameters.tagContentExcerpt) {
            this._parserContext.log.addMessageForTokenSequence('The @link tag content is missing', parameters.tagNameExcerpt.content, docLinkTag);
            return docLinkTag; // error
        }
        // Is the link destination a URL or a declaration reference?
        //
        // The JSDoc "@link" tag allows URLs, however supporting full URLs would be highly
        // ambiguous, for example "microsoft.windows.camera:" is an actual valid URI scheme,
        // and even the common "mailto:example.com" looks suspiciously like a declaration reference.
        // In practice JSDoc URLs are nearly always HTTP or HTTPS, so it seems fairly reasonable to
        // require the URL to have "://" and a scheme without any punctuation in it.  If a more exotic
        // URL is needed, the HTML "<a>" tag can always be used.
        // We start with a fairly broad classifier heuristic, and then the parsers will refine this:
        // 1. Does it start with "//"?
        // 2. Does it contain "://"?
        var looksLikeUrl = embeddedTokenReader.peekTokenKind() === Token_1.TokenKind.Slash
            && embeddedTokenReader.peekTokenAfterKind() === Token_1.TokenKind.Slash;
        var marker = embeddedTokenReader.createMarker();
        var done = looksLikeUrl;
        while (!done) {
            switch (embeddedTokenReader.peekTokenKind()) {
                // An URI scheme can contain letters, numbers, minus, plus, and periods
                case Token_1.TokenKind.AsciiWord:
                case Token_1.TokenKind.Period:
                case Token_1.TokenKind.Hyphen:
                case Token_1.TokenKind.Plus:
                    embeddedTokenReader.readToken();
                    break;
                case Token_1.TokenKind.Colon:
                    embeddedTokenReader.readToken();
                    // Once we a reach a colon, then it's a URL only if we see "://"
                    looksLikeUrl = embeddedTokenReader.peekTokenKind() === Token_1.TokenKind.Slash
                        && embeddedTokenReader.peekTokenAfterKind() === Token_1.TokenKind.Slash;
                    done = true;
                    break;
                default:
                    done = true;
            }
        }
        embeddedTokenReader.backtrackToMarker(marker);
        // Is the hyperlink a URL or a declaration reference?
        if (looksLikeUrl) {
            // It starts with something like "http://", so parse it as a URL
            if (!this._parseLinkTagUrlDestination(embeddedTokenReader, parameters, docInlineTagParameters.tagNameExcerpt.content, docLinkTag)) {
                return docLinkTag; // error
            }
        }
        else {
            // Otherwise, assume it's a declaration reference
            if (!this._parseLinkTagCodeDestination(embeddedTokenReader, parameters, docInlineTagParameters.tagNameExcerpt.content, docLinkTag)) {
                return docLinkTag; // error
            }
        }
        if (embeddedTokenReader.peekTokenKind() === Token_1.TokenKind.Spacing) {
            // The above parser rules should have consumed any spacing before the pipe
            throw new Error('Unconsumed spacing encountered after construct');
        }
        if (embeddedTokenReader.peekTokenKind() === Token_1.TokenKind.Pipe) {
            // Read the link text
            embeddedTokenReader.readToken();
            parameters.pipeExcerpt = new Excerpt_1.Excerpt({
                content: embeddedTokenReader.extractAccumulatedSequence()
            });
            // Read everything until the end
            // NOTE: Because we're using an embedded TokenReader, the TokenKind.EndOfInput occurs
            // when we reach the "}", not the end of the original input
            done = false;
            while (!done) {
                switch (embeddedTokenReader.peekTokenKind()) {
                    case Token_1.TokenKind.EndOfInput:
                        done = true;
                        break;
                    case Token_1.TokenKind.Pipe:
                    case Token_1.TokenKind.LeftCurlyBracket:
                        var badCharacter = embeddedTokenReader.readToken().toString();
                        this._parserContext.log.addMessageForTokenSequence("The \"" + badCharacter + "\" character may not be used in the link text without escaping it", embeddedTokenReader.extractAccumulatedSequence(), docLinkTag);
                        return docLinkTag; // error
                    default:
                        embeddedTokenReader.readToken();
                }
            }
            if (!embeddedTokenReader.isAccumulatedSequenceEmpty()) {
                var linkTextExcerpt = new Excerpt_1.Excerpt({
                    content: embeddedTokenReader.extractAccumulatedSequence()
                });
                parameters.linkText = linkTextExcerpt.content.toString();
                parameters.linkTextExcerpt = linkTextExcerpt;
            }
        }
        else if (embeddedTokenReader.peekTokenKind() !== Token_1.TokenKind.EndOfInput) {
            embeddedTokenReader.readToken();
            this._parserContext.log.addMessageForTokenSequence('Unexpected character after link destination', embeddedTokenReader.extractAccumulatedSequence(), docLinkTag);
            return docLinkTag; // error
        }
        // We don't need the tagContentExcerpt since those tokens are now associated with the link particles
        parameters.tagContentExcerpt = undefined;
        docLinkTag.updateParameters(parameters);
        return docLinkTag;
    };
    NodeParser.prototype._parseLinkTagUrlDestination = function (embeddedTokenReader, parameters, tokenSequenceForErrorContext, nodeForErrorContext) {
        // Simply accumulate everything up to the next space. We won't try to implement a proper
        // URI parser here.
        var url = '';
        var done = false;
        while (!done) {
            switch (embeddedTokenReader.peekTokenKind()) {
                case Token_1.TokenKind.Spacing:
                case Token_1.TokenKind.Newline:
                case Token_1.TokenKind.EndOfInput:
                case Token_1.TokenKind.Pipe:
                case Token_1.TokenKind.RightCurlyBracket:
                    done = true;
                    break;
                default:
                    url += embeddedTokenReader.readToken();
                    break;
            }
        }
        if (url.length === 0) {
            // This should be impossible since the caller ensures that peekTokenKind() === TokenKind.AsciiWord
            throw new Error('Missing URL in _parseLinkTagUrl()');
        }
        var excerptParameters = {
            content: embeddedTokenReader.extractAccumulatedSequence()
        };
        var invalidUrlExplanation = StringChecks_1.StringChecks.explainIfInvalidLinkUrl(url);
        if (invalidUrlExplanation) {
            this._parserContext.log.addMessageForTokenSequence(invalidUrlExplanation, excerptParameters.content, nodeForErrorContext);
            return false;
        }
        this._readSpacingAndNewlines(embeddedTokenReader);
        excerptParameters.spacingAfterContent = embeddedTokenReader.tryExtractAccumulatedSequence();
        parameters.urlDestination = url;
        parameters.urlDestinationExcerpt = new Excerpt_1.Excerpt(excerptParameters);
        return true;
    };
    NodeParser.prototype._parseLinkTagCodeDestination = function (embeddedTokenReader, parameters, tokenSequenceForErrorContext, nodeForErrorContext) {
        parameters.codeDestination = this._parseDeclarationReference(embeddedTokenReader, tokenSequenceForErrorContext, nodeForErrorContext);
        return !!parameters.codeDestination;
    };
    NodeParser.prototype._parseDeclarationReference = function (tokenReader, tokenSequenceForErrorContext, nodeForErrorContext) {
        tokenReader.assertAccumulatedSequenceIsEmpty();
        // The package name can contain characters that look like a member reference.  This means we need to scan forwards
        // to see if there is a "#".  However, we need to be careful not to match a "#" that is part of a quoted expression.
        var marker = tokenReader.createMarker();
        var hasHash = false;
        // A common mistake is to forget the "#" for package name or import path.  The telltale sign
        // of this is mistake is that we see path-only characters such as "@" or "/" in the beginning
        // where this would be a syntax error for a member reference.
        var lookingForImportCharacters = true;
        var sawImportCharacters = false;
        var done = false;
        while (!done) {
            switch (tokenReader.peekTokenKind()) {
                case Token_1.TokenKind.DoubleQuote:
                case Token_1.TokenKind.EndOfInput:
                case Token_1.TokenKind.LeftCurlyBracket:
                case Token_1.TokenKind.LeftParenthesis:
                case Token_1.TokenKind.LeftSquareBracket:
                case Token_1.TokenKind.Newline:
                case Token_1.TokenKind.Pipe:
                case Token_1.TokenKind.RightCurlyBracket:
                case Token_1.TokenKind.RightParenthesis:
                case Token_1.TokenKind.RightSquareBracket:
                case Token_1.TokenKind.SingleQuote:
                case Token_1.TokenKind.Spacing:
                    done = true;
                    break;
                case Token_1.TokenKind.PoundSymbol:
                    hasHash = true;
                    done = true;
                    break;
                case Token_1.TokenKind.Slash:
                case Token_1.TokenKind.AtSign:
                    if (lookingForImportCharacters) {
                        sawImportCharacters = true;
                    }
                    tokenReader.readToken();
                    break;
                case Token_1.TokenKind.AsciiWord:
                case Token_1.TokenKind.Period:
                case Token_1.TokenKind.Hyphen:
                    // It's a character that looks like part of a package name or import path,
                    // so don't set lookingForImportCharacters = false
                    tokenReader.readToken();
                    break;
                default:
                    // Once we reach something other than AsciiWord and Period, then the meaning of
                    // slashes and at-signs is no longer obvious.
                    lookingForImportCharacters = false;
                    tokenReader.readToken();
            }
        }
        if (!hasHash && sawImportCharacters) {
            // We saw characters that will be a syntax error if interpreted as a member reference,
            // but would make sense as a package name or import path, but we did not find a "#"
            this._parserContext.log.addMessageForTokenSequence('The declaration reference appears to contain a package name or import path,'
                + ' but it is missing the "#" delimiter', tokenReader.extractAccumulatedSequence(), nodeForErrorContext);
            return undefined;
        }
        tokenReader.backtrackToMarker(marker);
        var packageNameExcerpt;
        var importPathExcerpt;
        var importHashExcerpt;
        if (hasHash) {
            // If it starts with a "." then it's a relative path, not a package name
            if (tokenReader.peekTokenKind() !== Token_1.TokenKind.Period) {
                // Read the package name:
                var scopedPackageName = tokenReader.peekTokenKind() === Token_1.TokenKind.AtSign;
                var finishedScope = false;
                done = false;
                while (!done) {
                    switch (tokenReader.peekTokenKind()) {
                        case Token_1.TokenKind.EndOfInput:
                            // If hasHash=true, then we are expecting to stop when we reach the hash
                            throw new Error('Expecting pound symbol');
                        case Token_1.TokenKind.Slash:
                            // Stop at the first slash, unless this is a scoped package, in which case we stop at the second slash
                            if (scopedPackageName && !finishedScope) {
                                tokenReader.readToken();
                                finishedScope = true;
                            }
                            else {
                                done = true;
                            }
                            break;
                        case Token_1.TokenKind.PoundSymbol:
                            done = true;
                            break;
                        default:
                            tokenReader.readToken();
                    }
                }
                if (!tokenReader.isAccumulatedSequenceEmpty()) {
                    var packageNameExcerptParameters = {
                        content: tokenReader.extractAccumulatedSequence()
                    };
                    this._readSpacingAndNewlines(tokenReader);
                    packageNameExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
                    packageNameExcerpt = new Excerpt_1.Excerpt(packageNameExcerptParameters);
                    // Check that the packageName is syntactically valid
                    var explanation = StringChecks_1.StringChecks.explainIfInvalidPackageName(packageNameExcerpt.content.toString());
                    if (explanation) {
                        this._parserContext.log.addMessageForTokenSequence(explanation, packageNameExcerpt.content, nodeForErrorContext);
                        return undefined;
                    }
                }
            }
            // Read the import path:
            done = false;
            while (!done) {
                switch (tokenReader.peekTokenKind()) {
                    case Token_1.TokenKind.EndOfInput:
                        // If hasHash=true, then we are expecting to stop when we reach the hash
                        throw new Error('Expecting pound symbol');
                    case Token_1.TokenKind.PoundSymbol:
                        done = true;
                        break;
                    default:
                        tokenReader.readToken();
                }
            }
            if (!tokenReader.isAccumulatedSequenceEmpty()) {
                var importPathExcerptParameters = {
                    content: tokenReader.extractAccumulatedSequence()
                };
                this._readSpacingAndNewlines(tokenReader);
                importPathExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
                importPathExcerpt = new Excerpt_1.Excerpt(importPathExcerptParameters);
                // Check that the importPath is syntactically valid
                var explanation = StringChecks_1.StringChecks.explainIfInvalidImportPath(importPathExcerpt.content.toString(), !!packageNameExcerpt);
                if (explanation) {
                    this._parserContext.log.addMessageForTokenSequence(explanation, importPathExcerpt.content, nodeForErrorContext);
                    return undefined;
                }
            }
            // Read the import hash
            if (tokenReader.peekTokenKind() !== Token_1.TokenKind.PoundSymbol) {
                // The above logic should have left us at the PoundSymbol
                throw new Error('Expecting pound symbol');
            }
            tokenReader.readToken();
            var importHashExcerptParameters = {
                content: tokenReader.extractAccumulatedSequence()
            };
            this._readSpacingAndNewlines(tokenReader);
            importHashExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
            importHashExcerpt = new Excerpt_1.Excerpt(importHashExcerptParameters);
            if (packageNameExcerpt === undefined && importPathExcerpt === undefined) {
                this._parserContext.log.addMessageForTokenSequence('The hash character must be preceded by a package name or import path', importHashExcerpt.content, nodeForErrorContext);
                return undefined;
            }
        }
        // Read the member references:
        var memberReferences = [];
        done = false;
        while (!done) {
            switch (tokenReader.peekTokenKind()) {
                case Token_1.TokenKind.Period:
                case Token_1.TokenKind.LeftParenthesis:
                case Token_1.TokenKind.AsciiWord:
                case Token_1.TokenKind.Colon:
                case Token_1.TokenKind.LeftSquareBracket:
                case Token_1.TokenKind.DoubleQuote:
                    var expectingDot = memberReferences.length > 0;
                    var memberReference = this._parseMemberReference(tokenReader, expectingDot, tokenSequenceForErrorContext, nodeForErrorContext);
                    if (!memberReference) {
                        return undefined;
                    }
                    memberReferences.push(memberReference);
                    break;
                default:
                    done = true;
            }
        }
        if (packageNameExcerpt === undefined && importPathExcerpt === undefined && memberReferences.length === 0) {
            // We didn't find any parts of a declaration reference
            this._parserContext.log.addMessageForTokenSequence('Expecting a declaration reference', tokenSequenceForErrorContext, nodeForErrorContext);
            return undefined;
        }
        return new nodes_1.DocDeclarationReference({
            packageNameExcerpt: packageNameExcerpt,
            packageName: packageNameExcerpt !== undefined ? packageNameExcerpt.content.toString() : undefined,
            importPathExcerpt: importPathExcerpt,
            importPath: importPathExcerpt !== undefined ? importPathExcerpt.content.toString() : undefined,
            importHashExcerpt: importHashExcerpt,
            memberReferences: memberReferences
        });
    };
    NodeParser.prototype._parseMemberReference = function (tokenReader, expectingDot, tokenSequenceForErrorContext, nodeForErrorContext) {
        var dotExcerpt;
        // Read the dot operator
        if (expectingDot) {
            if (tokenReader.peekTokenKind() !== Token_1.TokenKind.Period) {
                this._parserContext.log.addMessageForTokenSequence('Expecting a period before the next component'
                    + ' of a declaration reference', tokenSequenceForErrorContext, nodeForErrorContext);
                return undefined;
            }
            tokenReader.readToken();
            var dotExcerptParameters = {
                content: tokenReader.extractAccumulatedSequence()
            };
            this._readSpacingAndNewlines(tokenReader);
            dotExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
            dotExcerpt = new Excerpt_1.Excerpt(dotExcerptParameters);
        }
        // Read the left parenthesis if there is one
        var leftParenthesisExcerpt;
        if (tokenReader.peekTokenKind() === Token_1.TokenKind.LeftParenthesis) {
            tokenReader.readToken();
            var leftParenthesisExcerptParameters = {
                content: tokenReader.extractAccumulatedSequence()
            };
            this._readSpacingAndNewlines(tokenReader);
            leftParenthesisExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
            leftParenthesisExcerpt = new Excerpt_1.Excerpt(leftParenthesisExcerptParameters);
        }
        var memberIdentifier = undefined;
        var memberSymbol = undefined;
        // Read the member identifier or symbol
        if (tokenReader.peekTokenKind() === Token_1.TokenKind.LeftSquareBracket) {
            memberSymbol = this._parseMemberSymbol(tokenReader, nodeForErrorContext);
            if (!memberSymbol) {
                return undefined;
            }
        }
        else {
            memberIdentifier = this._parseMemberIdentifier(tokenReader, tokenSequenceForErrorContext, nodeForErrorContext);
            if (!memberIdentifier) {
                return undefined;
            }
        }
        // Read the colon
        var colonExcerpt;
        var selector = undefined;
        if (tokenReader.peekTokenKind() === Token_1.TokenKind.Colon) {
            tokenReader.readToken();
            var colonExcerptParameters = {
                content: tokenReader.extractAccumulatedSequence()
            };
            this._readSpacingAndNewlines(tokenReader);
            colonExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
            colonExcerpt = new Excerpt_1.Excerpt(colonExcerptParameters);
            if (!leftParenthesisExcerpt) {
                // In the current TSDoc draft standard, a member reference with a selector requires the parentheses.
                // It would be reasonable to make the parentheses optional, and we are contemplating simplifying the
                // notation in the future.  But for now the parentheses are required.
                this._parserContext.log.addMessageForTokenSequence('Syntax error in declaration reference: the member selector must be enclosed in parentheses', colonExcerpt.content, nodeForErrorContext);
                return undefined;
            }
            // If there is a colon, then read the selector
            selector = this._parseMemberSelector(tokenReader, colonExcerptParameters.content, nodeForErrorContext);
            if (!selector) {
                return undefined;
            }
        }
        else {
            if (leftParenthesisExcerpt) {
                this._parserContext.log.addMessageForTokenSequence('Expecting a colon after the identifier because'
                    + ' the expression is in parentheses', leftParenthesisExcerpt.content, nodeForErrorContext);
                return undefined;
            }
        }
        // Read the right parenthesis
        var rightParenthesisExcerpt;
        if (leftParenthesisExcerpt) {
            if (tokenReader.peekTokenKind() !== Token_1.TokenKind.RightParenthesis) {
                this._parserContext.log.addMessageForTokenSequence('Expecting a matching right parenthesis', leftParenthesisExcerpt.content, nodeForErrorContext);
                return undefined;
            }
            tokenReader.readToken();
            var rightParenthesisExcerptParameters = {
                content: tokenReader.extractAccumulatedSequence()
            };
            this._readSpacingAndNewlines(tokenReader);
            rightParenthesisExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
            rightParenthesisExcerpt = new Excerpt_1.Excerpt(rightParenthesisExcerptParameters);
        }
        return new nodes_1.DocMemberReference({
            hasDot: dotExcerpt !== undefined,
            dotExcerpt: dotExcerpt,
            leftParenthesisExcerpt: leftParenthesisExcerpt,
            memberIdentifier: memberIdentifier,
            memberSymbol: memberSymbol,
            colonExcerpt: colonExcerpt,
            selector: selector,
            rightParenthesisExcerpt: rightParenthesisExcerpt
        });
    };
    NodeParser.prototype._parseMemberSymbol = function (tokenReader, nodeForErrorContext) {
        // Read the "["
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.LeftSquareBracket) {
            // This should be impossible since the caller ensures that peekTokenKind() === TokenKind.LeftSquareBracket
            throw new Error('Expecting "["');
        }
        tokenReader.readToken();
        var leftBracketExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        this._readSpacingAndNewlines(tokenReader);
        leftBracketExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
        // Read the declaration reference
        var declarationReference = this._parseDeclarationReference(tokenReader, leftBracketExcerptParameters.content, nodeForErrorContext);
        if (!declarationReference) {
            this._parserContext.log.addMessageForTokenSequence('Missing declaration reference in symbol reference', leftBracketExcerptParameters.content, nodeForErrorContext);
            return undefined;
        }
        // Read the "]"
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.RightSquareBracket) {
            this._parserContext.log.addMessageForTokenSequence('Missing closing square bracket for symbol reference', leftBracketExcerptParameters.content, nodeForErrorContext);
            return undefined;
        }
        tokenReader.readToken();
        var rightBracketExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        this._readSpacingAndNewlines(tokenReader);
        rightBracketExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
        return new nodes_1.DocMemberSymbol({
            leftBracketExcerpt: new Excerpt_1.Excerpt(leftBracketExcerptParameters),
            symbolReference: declarationReference,
            rightBracketExcerpt: new Excerpt_1.Excerpt(rightBracketExcerptParameters)
        });
    };
    NodeParser.prototype._parseMemberIdentifier = function (tokenReader, tokenSequenceForErrorContext, nodeForErrorContext) {
        // Is this a quoted identifier?
        if (tokenReader.peekTokenKind() === Token_1.TokenKind.DoubleQuote) {
            // Read the opening '"'
            tokenReader.readToken();
            var leftQuoteExcerptParameters = {
                content: tokenReader.extractAccumulatedSequence()
            };
            // Read the text inside the quotes
            while (tokenReader.peekTokenKind() !== Token_1.TokenKind.DoubleQuote) {
                if (tokenReader.peekTokenKind() === Token_1.TokenKind.EndOfInput) {
                    this._parserContext.log.addMessageForTokenSequence('Unexpected end of input inside quoted member identifier', leftQuoteExcerptParameters.content, nodeForErrorContext);
                    return undefined;
                }
                tokenReader.readToken();
            }
            if (tokenReader.isAccumulatedSequenceEmpty()) {
                this._parserContext.log.addMessageForTokenSequence('The quoted identifier cannot be empty', leftQuoteExcerptParameters.content, nodeForErrorContext);
                return undefined;
            }
            var identifierExcerptParameters = {
                content: tokenReader.extractAccumulatedSequence()
            };
            // Read the closing '""
            tokenReader.readToken(); // read the quote
            var rightQuoteExcerptParameters = {
                content: tokenReader.extractAccumulatedSequence()
            };
            this._readSpacingAndNewlines(tokenReader);
            rightQuoteExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
            return new nodes_1.DocMemberIdentifier({
                leftQuoteExcerpt: new Excerpt_1.Excerpt(leftQuoteExcerptParameters),
                identifierExcerpt: new Excerpt_1.Excerpt(identifierExcerptParameters),
                identifier: identifierExcerptParameters.content.toString(),
                rightQuoteExcerpt: new Excerpt_1.Excerpt(rightQuoteExcerptParameters)
            });
        }
        else {
            // Otherwise assume it's a valid TypeScript identifier
            if (tokenReader.peekTokenKind() !== Token_1.TokenKind.AsciiWord) {
                this._parserContext.log.addMessageForTokenSequence('Syntax error in declaration reference: expecting a member identifier', tokenSequenceForErrorContext, nodeForErrorContext);
                return undefined;
            }
            var identifier = tokenReader.readToken().toString();
            var identifierExcerptParameters = {
                content: tokenReader.extractAccumulatedSequence()
            };
            this._readSpacingAndNewlines(tokenReader);
            identifierExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
            var explanation = StringChecks_1.StringChecks.explainIfInvalidUnquotedIdentifier(identifier);
            if (explanation) {
                this._parserContext.log.addMessageForTokenSequence(explanation, identifierExcerptParameters.content, nodeForErrorContext);
                return undefined;
            }
            return new nodes_1.DocMemberIdentifier({
                identifierExcerpt: new Excerpt_1.Excerpt(identifierExcerptParameters),
                identifier: identifier
            });
        }
    };
    NodeParser.prototype._parseMemberSelector = function (tokenReader, tokenSequenceForErrorContext, nodeForErrorContext) {
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.AsciiWord) {
            this._parserContext.log.addMessageForTokenSequence('Expecting a selector label after the colon', tokenSequenceForErrorContext, nodeForErrorContext);
        }
        var selector = tokenReader.readToken().toString();
        var selectorExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        this._readSpacingAndNewlines(tokenReader);
        selectorExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
        var docMemberSelector = new nodes_1.DocMemberSelector({
            excerpt: new Excerpt_1.Excerpt(selectorExcerptParameters),
            selector: selector
        });
        if (docMemberSelector.errorMessage) {
            this._parserContext.log.addMessageForTokenSequence(docMemberSelector.errorMessage, selectorExcerptParameters.content, nodeForErrorContext);
            return undefined;
        }
        return docMemberSelector;
    };
    NodeParser.prototype._parseHtmlStartTag = function (tokenReader) {
        tokenReader.assertAccumulatedSequenceIsEmpty();
        var marker = tokenReader.createMarker();
        // Read the "<" delimiter
        var lessThanToken = tokenReader.readToken();
        if (lessThanToken.kind !== Token_1.TokenKind.LessThan) {
            return this._backtrackAndCreateError(tokenReader, marker, 'Expecting an HTML tag starting with "<"');
        }
        // NOTE: CommonMark does not permit whitespace after the "<"
        var openingDelimiterExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        // Read the element name
        var elementName = this._parseHtmlName(tokenReader);
        if (isFailure(elementName)) {
            return this._backtrackAndCreateErrorForFailure(tokenReader, marker, 'Invalid HTML element: ', elementName);
        }
        var elementNameExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        var spacingAfterElementName = this._readSpacingAndNewlines(tokenReader);
        elementNameExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
        var htmlAttributes = [];
        // Read the attributes until we see a ">" or "/>"
        while (tokenReader.peekTokenKind() === Token_1.TokenKind.AsciiWord) {
            // Read the attribute
            var attributeNode = this._parseHtmlAttribute(tokenReader);
            if (isFailure(attributeNode)) {
                return this._backtrackAndCreateErrorForFailure(tokenReader, marker, 'The HTML element has an invalid attribute: ', attributeNode);
            }
            htmlAttributes.push(attributeNode);
        }
        // Read the closing "/>" or ">" as the Excerpt.suffix
        tokenReader.assertAccumulatedSequenceIsEmpty();
        var endDelimiterMarker = tokenReader.createMarker();
        var selfClosingTag = false;
        if (tokenReader.peekTokenKind() === Token_1.TokenKind.Slash) {
            tokenReader.readToken();
            selfClosingTag = true;
        }
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.GreaterThan) {
            var failure = this._createFailureForTokensSince(tokenReader, 'Expecting an attribute or ">" or "/>"', endDelimiterMarker);
            return this._backtrackAndCreateErrorForFailure(tokenReader, marker, 'The HTML tag has invalid syntax: ', failure);
        }
        tokenReader.readToken();
        var closingDelimiterExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        // NOTE: We don't read excerptParameters.separator here, since if there is any it
        // will be represented as DocPlainText.
        return new nodes_1.DocHtmlStartTag({
            openingDelimiterExcerpt: new Excerpt_1.Excerpt(openingDelimiterExcerptParameters),
            elementNameExcerpt: new Excerpt_1.Excerpt(elementNameExcerptParameters),
            elementName: elementName,
            spacingAfterElementName: spacingAfterElementName,
            htmlAttributes: htmlAttributes,
            selfClosingTag: selfClosingTag,
            closingDelimiterExcerpt: new Excerpt_1.Excerpt(closingDelimiterExcerptParameters)
        });
    };
    NodeParser.prototype._parseHtmlAttribute = function (tokenReader) {
        tokenReader.assertAccumulatedSequenceIsEmpty();
        // Read the attribute name
        var attributeName = this._parseHtmlName(tokenReader);
        if (isFailure(attributeName)) {
            return attributeName;
        }
        var attributeNameExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        var spacingAfterAttributeName = this._readSpacingAndNewlines(tokenReader);
        attributeNameExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
        // Read the equals
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.Equals) {
            return this._createFailureForToken(tokenReader, 'Expecting "=" after HTML attribute name');
        }
        tokenReader.readToken();
        var equalsExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        var spacingAfterEquals = this._readSpacingAndNewlines(tokenReader);
        equalsExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
        // Read the attribute value
        var attributeValue = this._parseHtmlString(tokenReader);
        if (isFailure(attributeValue)) {
            return attributeValue;
        }
        var attributeValueExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        var spacingAfterAttributeValue = this._readSpacingAndNewlines(tokenReader);
        attributeValueExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
        return new nodes_1.DocHtmlAttribute({
            attributeNameExcerpt: new Excerpt_1.Excerpt(attributeNameExcerptParameters),
            attributeName: attributeName,
            spacingAfterAttributeName: spacingAfterAttributeName,
            equalsExcerpt: new Excerpt_1.Excerpt(equalsExcerptParameters),
            spacingAfterEquals: spacingAfterEquals,
            attributeValueExcerpt: new Excerpt_1.Excerpt(attributeValueExcerptParameters),
            attributeValue: attributeValue,
            spacingAfterAttributeValue: spacingAfterAttributeValue
        });
    };
    NodeParser.prototype._parseHtmlString = function (tokenReader) {
        var marker = tokenReader.createMarker();
        var quoteTokenKind = tokenReader.peekTokenKind();
        if (quoteTokenKind !== Token_1.TokenKind.DoubleQuote && quoteTokenKind !== Token_1.TokenKind.SingleQuote) {
            return this._createFailureForToken(tokenReader, 'Expecting an HTML string starting with a single-quote or double-quote character');
        }
        tokenReader.readToken();
        var textWithoutQuotes = '';
        while (true) {
            var peekedTokenKind = tokenReader.peekTokenKind();
            // Did we find the matching token?
            if (peekedTokenKind === quoteTokenKind) {
                tokenReader.readToken(); // extract the quote
                break;
            }
            if (peekedTokenKind === Token_1.TokenKind.EndOfInput || peekedTokenKind === Token_1.TokenKind.Newline) {
                return this._createFailureForToken(tokenReader, 'The HTML string is missing its closing quote', marker);
            }
            textWithoutQuotes += tokenReader.readToken().toString();
        }
        // The next attribute cannot start immediately after this one
        if (tokenReader.peekTokenKind() === Token_1.TokenKind.AsciiWord) {
            return this._createFailureForToken(tokenReader, 'The next character after a closing quote must be spacing or punctuation');
        }
        return textWithoutQuotes;
    };
    NodeParser.prototype._parseHtmlEndTag = function (tokenReader) {
        tokenReader.assertAccumulatedSequenceIsEmpty();
        var marker = tokenReader.createMarker();
        // Read the "</" delimiter
        var lessThanToken = tokenReader.peekToken();
        if (lessThanToken.kind !== Token_1.TokenKind.LessThan) {
            return this._backtrackAndCreateError(tokenReader, marker, 'Expecting an HTML tag starting with "</"');
        }
        tokenReader.readToken();
        var slashToken = tokenReader.peekToken();
        if (slashToken.kind !== Token_1.TokenKind.Slash) {
            return this._backtrackAndCreateError(tokenReader, marker, 'Expecting an HTML tag starting with "</"');
        }
        tokenReader.readToken();
        // NOTE: Spaces are not permitted here
        // https://www.w3.org/TR/html5/syntax.html#end-tags
        var openingDelimiterExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        // Read the tag name
        var elementName = this._parseHtmlName(tokenReader);
        if (isFailure(elementName)) {
            return this._backtrackAndCreateErrorForFailure(tokenReader, marker, 'Expecting an HTML element name: ', elementName);
        }
        var elementNameExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        this._readSpacingAndNewlines(tokenReader);
        elementNameExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();
        // Read the closing ">"
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.GreaterThan) {
            var failure = this._createFailureForToken(tokenReader, 'Expecting a closing ">" for the HTML tag');
            return this._backtrackAndCreateErrorForFailure(tokenReader, marker, '', failure);
        }
        tokenReader.readToken();
        var closingDelimiterExcerptParameters = {
            content: tokenReader.extractAccumulatedSequence()
        };
        return new nodes_1.DocHtmlEndTag({
            openingDelimiterExcerpt: new Excerpt_1.Excerpt(openingDelimiterExcerptParameters),
            elementNameExcerpt: new Excerpt_1.Excerpt(elementNameExcerptParameters),
            elementName: elementName,
            closingDelimiterExcerpt: new Excerpt_1.Excerpt(closingDelimiterExcerptParameters)
        });
    };
    /**
     * Parses an HTML name such as an element name or attribute name.
     */
    NodeParser.prototype._parseHtmlName = function (tokenReader) {
        var htmlName = '';
        var marker = tokenReader.createMarker();
        if (tokenReader.peekTokenKind() === Token_1.TokenKind.Spacing) {
            return this._createFailureForTokensSince(tokenReader, 'A space is not allowed here', marker);
        }
        var done = false;
        while (!done) {
            switch (tokenReader.peekTokenKind()) {
                case Token_1.TokenKind.AsciiWord:
                case Token_1.TokenKind.Hyphen:
                    htmlName += tokenReader.readToken().toString();
                    break;
                default:
                    done = true;
                    break;
            }
        }
        if (htmlName.length === 0) {
            return this._createFailureForToken(tokenReader, 'Expecting an HTML name');
        }
        if (!NodeParser.htmlNameRegExp.test(htmlName)) {
            return this._createFailureForTokensSince(tokenReader, 'An HTML name must be a sequence of letters separated by hyphens', marker);
        }
        return htmlName;
    };
    NodeParser.prototype._parseFencedCode = function (tokenReader) {
        tokenReader.assertAccumulatedSequenceIsEmpty();
        var startMarker = tokenReader.createMarker();
        var endOfOpeningDelimiterMarker = startMarker + 2;
        switch (tokenReader.peekPreviousTokenKind()) {
            case Token_1.TokenKind.Newline:
            case Token_1.TokenKind.EndOfInput:
                break;
            default:
                return this._backtrackAndCreateErrorRange(tokenReader, startMarker, 
                // include the three backticks so they don't get reinterpreted as a code span
                endOfOpeningDelimiterMarker, 'The opening backtick for a code fence must appear at the start of the line');
        }
        // Read the opening ``` delimiter
        var openingDelimiter = '';
        openingDelimiter += tokenReader.readToken();
        openingDelimiter += tokenReader.readToken();
        openingDelimiter += tokenReader.readToken();
        if (openingDelimiter !== '```') {
            // This would be a parser bug -- the caller of _parseFencedCode() should have verified this while
            // looking ahead to distinguish code spans/fences
            throw new Error('Expecting three backticks');
        }
        var openingDelimiterSequence = tokenReader.extractAccumulatedSequence();
        // Read any spaces after the delimiter,
        // but NOT the Newline since that goes with the language particle
        while (tokenReader.peekTokenKind() === Token_1.TokenKind.Spacing) {
            tokenReader.readToken();
        }
        var openingDelimiterExcerpt = new Excerpt_1.Excerpt({
            content: openingDelimiterSequence,
            spacingAfterContent: tokenReader.tryExtractAccumulatedSequence()
        });
        // Read the language specifier (if present) and newline
        var done = false;
        var startOfPaddingMarker = undefined;
        while (!done) {
            switch (tokenReader.peekTokenKind()) {
                case Token_1.TokenKind.Spacing:
                case Token_1.TokenKind.Newline:
                    if (startOfPaddingMarker === undefined) {
                        // Starting a new run of spacing characters
                        startOfPaddingMarker = tokenReader.createMarker();
                    }
                    if (tokenReader.peekTokenKind() === Token_1.TokenKind.Newline) {
                        done = true;
                    }
                    tokenReader.readToken();
                    break;
                case Token_1.TokenKind.Backtick:
                    var failure = this._createFailureForToken(tokenReader, 'The language specifier cannot contain backtick characters');
                    return this._backtrackAndCreateErrorRangeForFailure(tokenReader, startMarker, endOfOpeningDelimiterMarker, 'Error parsing code fence: ', failure);
                case Token_1.TokenKind.EndOfInput:
                    var failure2 = this._createFailureForToken(tokenReader, 'Missing closing delimiter');
                    return this._backtrackAndCreateErrorRangeForFailure(tokenReader, startMarker, endOfOpeningDelimiterMarker, 'Error parsing code fence: ', failure2);
                default:
                    // more non-spacing content
                    startOfPaddingMarker = undefined;
                    tokenReader.readToken();
                    break;
            }
        }
        // At this point, we must have accumulated at least a newline token.
        // Example: "pov-ray sdl    \n"
        var languageSequence = tokenReader.extractAccumulatedSequence();
        var languageExcerpt = new Excerpt_1.Excerpt({
            // Example: "pov-ray sdl"
            content: languageSequence.getNewSequence(languageSequence.startIndex, startOfPaddingMarker),
            // Example: "    \n"
            spacingAfterContent: languageSequence.getNewSequence(startOfPaddingMarker, languageSequence.endIndex)
        });
        // Read the code content until we see the closing ``` delimiter
        var codeEndMarker = -1;
        done = false;
        var tokenBeforeDelimiter;
        while (!done) {
            switch (tokenReader.peekTokenKind()) {
                case Token_1.TokenKind.EndOfInput:
                    var failure2 = this._createFailureForToken(tokenReader, 'Missing closing delimiter');
                    return this._backtrackAndCreateErrorRangeForFailure(tokenReader, startMarker, endOfOpeningDelimiterMarker, 'Error parsing code fence: ', failure2);
                case Token_1.TokenKind.Newline:
                    tokenBeforeDelimiter = tokenReader.readToken();
                    codeEndMarker = tokenReader.createMarker();
                    while (tokenReader.peekTokenKind() === Token_1.TokenKind.Spacing) {
                        tokenBeforeDelimiter = tokenReader.readToken();
                    }
                    if (tokenReader.peekTokenKind() !== Token_1.TokenKind.Backtick) {
                        break;
                    }
                    tokenReader.readToken(); // first backtick
                    if (tokenReader.peekTokenKind() !== Token_1.TokenKind.Backtick) {
                        break;
                    }
                    tokenReader.readToken(); // second backtick
                    if (tokenReader.peekTokenKind() !== Token_1.TokenKind.Backtick) {
                        break;
                    }
                    tokenReader.readToken(); // third backtick
                    done = true;
                    break;
                default:
                    tokenReader.readToken();
                    break;
            }
        }
        if (tokenBeforeDelimiter.kind !== Token_1.TokenKind.Newline) {
            this._parserContext.log.addMessageForTextRange('The closing delimiter for a code fence must not be indented', tokenBeforeDelimiter.range);
        }
        // Example: "code 1\ncode 2\n   ```"
        var codeAndDelimiterSequence = tokenReader.extractAccumulatedSequence();
        var codeExcerpt = new Excerpt_1.Excerpt({
            content: codeAndDelimiterSequence.getNewSequence(codeAndDelimiterSequence.startIndex, codeEndMarker)
        });
        // Read the spacing and newline after the closing delimiter
        done = false;
        while (!done) {
            switch (tokenReader.peekTokenKind()) {
                case Token_1.TokenKind.Spacing:
                    tokenReader.readToken();
                    break;
                case Token_1.TokenKind.Newline:
                    done = true;
                    tokenReader.readToken();
                    break;
                case Token_1.TokenKind.EndOfInput:
                    done = true;
                    break;
                default:
                    this._parserContext.log.addMessageForTextRange('Unexpected characters after closing delimiter for code fence', tokenReader.peekToken().range);
                    done = true;
                    break;
            }
        }
        var closingDelimiterExcerpt = new Excerpt_1.Excerpt({
            // Example: "```"
            content: codeAndDelimiterSequence.getNewSequence(codeEndMarker, codeAndDelimiterSequence.endIndex),
            // Example: "   \n"
            spacingAfterContent: tokenReader.tryExtractAccumulatedSequence()
        });
        return new nodes_1.DocFencedCode({
            openingDelimiterExcerpt: openingDelimiterExcerpt,
            languageExcerpt: languageExcerpt,
            language: languageExcerpt.content.toString(),
            codeExcerpt: codeExcerpt,
            code: codeExcerpt.content.toString(),
            closingDelimiterExcerpt: closingDelimiterExcerpt
        });
    };
    NodeParser.prototype._parseCodeSpan = function (tokenReader) {
        tokenReader.assertAccumulatedSequenceIsEmpty();
        var marker = tokenReader.createMarker();
        // Parse the opening backtick
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.Backtick) {
            return this._createError(tokenReader, 'Expecting a code span starting with a backtick character "`"');
        }
        tokenReader.readToken(); // read the backtick
        var openingDelimiterExcerpt = new Excerpt_1.Excerpt({
            content: tokenReader.extractAccumulatedSequence()
        });
        var codeExcerpt;
        var closingDelimiterExcerpt;
        // Parse the content backtick
        while (true) {
            var peekedTokenKind = tokenReader.peekTokenKind();
            // Did we find the matching token?
            if (peekedTokenKind === Token_1.TokenKind.Backtick) {
                if (tokenReader.isAccumulatedSequenceEmpty()) {
                    return this._backtrackAndCreateErrorRange(tokenReader, marker, marker + 1, 'A code span must contain at least one character between the backticks');
                }
                codeExcerpt = new Excerpt_1.Excerpt({
                    content: tokenReader.extractAccumulatedSequence()
                });
                tokenReader.readToken();
                closingDelimiterExcerpt = new Excerpt_1.Excerpt({
                    content: tokenReader.extractAccumulatedSequence()
                });
                break;
            }
            if (peekedTokenKind === Token_1.TokenKind.EndOfInput || peekedTokenKind === Token_1.TokenKind.Newline) {
                return this._backtrackAndCreateError(tokenReader, marker, 'The code span is missing its closing backtick');
            }
            tokenReader.readToken();
        }
        return new nodes_1.DocCodeSpan({
            openingDelimiterExcerpt: openingDelimiterExcerpt,
            codeExcerpt: codeExcerpt,
            code: codeExcerpt.content.toString(),
            closingDelimiterExcerpt: closingDelimiterExcerpt
        });
    };
    NodeParser.prototype._readSpacingAndNewlines = function (tokenReader) {
        var result = '';
        var done = false;
        do {
            switch (tokenReader.peekTokenKind()) {
                case Token_1.TokenKind.Spacing:
                case Token_1.TokenKind.Newline:
                    result += tokenReader.readToken().toString();
                    break;
                default:
                    done = true;
                    break;
            }
        } while (!done);
        return result;
    };
    /**
     * Read the next token, and report it as a DocErrorText node.
     */
    NodeParser.prototype._createError = function (tokenReader, errorMessage) {
        tokenReader.readToken();
        var tokenSequence = tokenReader.extractAccumulatedSequence();
        var docErrorText = new nodes_1.DocErrorText({
            excerpt: new Excerpt_1.Excerpt({ content: tokenSequence }),
            text: tokenSequence.toString(),
            errorMessage: errorMessage,
            errorLocation: tokenSequence
        });
        this._parserContext.log.addMessageForDocErrorText(docErrorText);
        return docErrorText;
    };
    /**
     * Rewind to the specified marker, read the next token, and report it as a DocErrorText node.
     */
    NodeParser.prototype._backtrackAndCreateError = function (tokenReader, marker, errorMessage) {
        tokenReader.backtrackToMarker(marker);
        return this._createError(tokenReader, errorMessage);
    };
    /**
     * Rewind to the errorStartMarker, read the tokens up to and including errorInclusiveEndMarker,
     * and report it as a DocErrorText node.
     */
    NodeParser.prototype._backtrackAndCreateErrorRange = function (tokenReader, errorStartMarker, errorInclusiveEndMarker, errorMessage) {
        tokenReader.backtrackToMarker(errorStartMarker);
        while (tokenReader.createMarker() !== errorInclusiveEndMarker) {
            tokenReader.readToken();
        }
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.EndOfInput) {
            tokenReader.readToken();
        }
        var tokenSequence = tokenReader.extractAccumulatedSequence();
        var docErrorText = new nodes_1.DocErrorText({
            excerpt: new Excerpt_1.Excerpt({ content: tokenSequence }),
            text: tokenSequence.toString(),
            errorMessage: errorMessage,
            errorLocation: tokenSequence
        });
        this._parserContext.log.addMessageForDocErrorText(docErrorText);
        return docErrorText;
    };
    /**
     * Rewind to the specified marker, read the next token, and report it as a DocErrorText node
     * whose location is based on an IFailure.
     */
    NodeParser.prototype._backtrackAndCreateErrorForFailure = function (tokenReader, marker, errorMessagePrefix, failure) {
        tokenReader.backtrackToMarker(marker);
        tokenReader.readToken();
        var tokenSequence = tokenReader.extractAccumulatedSequence();
        var docErrorText = new nodes_1.DocErrorText({
            excerpt: new Excerpt_1.Excerpt({ content: tokenSequence }),
            text: tokenSequence.toString(),
            errorMessage: errorMessagePrefix + failure.failureMessage,
            errorLocation: failure.failureLocation
        });
        this._parserContext.log.addMessageForDocErrorText(docErrorText);
        return docErrorText;
    };
    /**
     * Rewind to the errorStartMarker, read the tokens up to and including errorInclusiveEndMarker,
     * and report it as a DocErrorText node whose location is based on an IFailure.
     */
    NodeParser.prototype._backtrackAndCreateErrorRangeForFailure = function (tokenReader, errorStartMarker, errorInclusiveEndMarker, errorMessagePrefix, failure) {
        tokenReader.backtrackToMarker(errorStartMarker);
        while (tokenReader.createMarker() !== errorInclusiveEndMarker) {
            tokenReader.readToken();
        }
        if (tokenReader.peekTokenKind() !== Token_1.TokenKind.EndOfInput) {
            tokenReader.readToken();
        }
        var tokenSequence = tokenReader.extractAccumulatedSequence();
        var docErrorText = new nodes_1.DocErrorText({
            excerpt: new Excerpt_1.Excerpt({ content: tokenSequence }),
            text: tokenSequence.toString(),
            errorMessage: errorMessagePrefix + failure.failureMessage,
            errorLocation: failure.failureLocation
        });
        this._parserContext.log.addMessageForDocErrorText(docErrorText);
        return docErrorText;
    };
    /**
     * Creates an IFailure whose TokenSequence is a single token.  If a marker is not specified,
     * then it is the current token.
     */
    NodeParser.prototype._createFailureForToken = function (tokenReader, failureMessage, tokenMarker) {
        if (!tokenMarker) {
            tokenMarker = tokenReader.createMarker();
        }
        var tokenSequence = new TokenSequence_1.TokenSequence({
            parserContext: this._parserContext,
            startIndex: tokenMarker,
            endIndex: tokenMarker + 1
        });
        return {
            failureMessage: failureMessage,
            failureLocation: tokenSequence
        };
    };
    /**
     * Creates an IFailure whose TokenSequence starts from the specified marker and
     * encompasses all tokens read since then.  If none were read, then the next token used.
     */
    NodeParser.prototype._createFailureForTokensSince = function (tokenReader, failureMessage, startMarker) {
        var endMarker = tokenReader.createMarker();
        if (endMarker < startMarker) {
            // This would be a parser bug
            throw new Error('Invalid startMarker');
        }
        if (endMarker === startMarker) {
            ++endMarker;
        }
        var tokenSequence = new TokenSequence_1.TokenSequence({
            parserContext: this._parserContext,
            startIndex: startMarker,
            endIndex: endMarker
        });
        return {
            failureMessage: failureMessage,
            failureLocation: tokenSequence
        };
    };
    // https://www.w3.org/TR/html5/syntax.html#tag-name
    // https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
    NodeParser.htmlNameRegExp = /^[a-z]+(\-[a-z]+)*$/i;
    return NodeParser;
}());
exports.NodeParser = NodeParser;
//# sourceMappingURL=NodeParser.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/ParagraphSplitter.js":
/*!************************************************!*\
  !*** ../tsdoc/lib/parser/ParagraphSplitter.js ***!
  \************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = __webpack_require__(/*! ../nodes */ "../tsdoc/lib/nodes/index.js");
/**
 * The ParagraphSplitter is a secondary stage that runs after the NodeParser has constructed
 * the DocComment.  It splits DocParagraph nodes into multiple paragraphs by looking for
 * paragraph delimiters.  Following CommonMark conventions, paragraphs are delimited by
 * one or more blank lines.  (These lines end with SoftBreak nodes.)  The blank lines are
 * not discarded.  Instead, they are attached to the preceding paragraph.  If the DocParagraph
 * starts with blank lines, they are preserved to avoid creating a paragraph containing only
 * whitespace.
 */
var ParagraphSplitter = /** @class */ (function () {
    function ParagraphSplitter() {
    }
    /**
     * Split all paragraphs belonging to the provided DocComment.
     */
    ParagraphSplitter.splitParagraphs = function (docComment) {
        for (var _i = 0, _a = docComment.getChildNodes(); _i < _a.length; _i++) {
            var node = _a[_i];
            if (node instanceof nodes_1.DocSection) {
                ParagraphSplitter.splitParagraphsForSection(node);
            }
        }
    };
    /**
     * Split all paragraphs belonging to the provided DocSection.
     */
    ParagraphSplitter.splitParagraphsForSection = function (docSection) {
        var inputNodes = docSection.nodes;
        var outputNodes = [];
        for (var _i = 0, inputNodes_1 = inputNodes; _i < inputNodes_1.length; _i++) {
            var oldNode = inputNodes_1[_i];
            if (oldNode.kind === "Paragraph" /* Paragraph */) {
                ParagraphSplitter._splitParagraph(oldNode, outputNodes);
            }
            else {
                outputNodes.push(oldNode);
            }
        }
        // Replace the inputNodes with the outputNodes
        docSection.clearNodes();
        docSection.appendNodes(outputNodes);
    };
    ParagraphSplitter._splitParagraph = function (oldParagraph, outputNodes) {
        var inputParagraphNodes = oldParagraph.nodes;
        var currentParagraph = new nodes_1.DocParagraph({});
        outputNodes.push(currentParagraph);
        var state = 0 /* Start */;
        var currentIndex = 0;
        while (currentIndex < inputParagraphNodes.length) {
            // Scan forwards to the end of the line
            var isBlankLine = true;
            var lineEndIndex = currentIndex; // non-inclusive
            do {
                var node = inputParagraphNodes[lineEndIndex++];
                if (node.kind === "SoftBreak" /* SoftBreak */) {
                    break;
                }
                if (isBlankLine) {
                    if (!this._isWhitespace(node)) {
                        isBlankLine = false;
                    }
                }
            } while (lineEndIndex < inputParagraphNodes.length);
            // At this point, the line and SoftBreak will be in inputParagraphNodes.slice(currentIndex, lineEndIndex)
            switch (state) {
                case 0 /* Start */:
                    // We're skipping any blank lines that start the first paragraph
                    if (!isBlankLine) {
                        state = 1 /* AwaitingTrailer */;
                    }
                    break;
                case 1 /* AwaitingTrailer */:
                    // We already saw some content, so now we're looking for a blank line that starts the trailer
                    // at the end of this paragraph
                    if (isBlankLine) {
                        state = 2 /* ReadingTrailer */;
                    }
                    break;
                case 2 /* ReadingTrailer */:
                    // We already found the trailer, so now we're looking for a non-blank line that will
                    // begin a new paragraph
                    if (!isBlankLine) {
                        // Start a new paragraph
                        currentParagraph = new nodes_1.DocParagraph({});
                        outputNodes.push(currentParagraph);
                        state = 1 /* AwaitingTrailer */;
                    }
                    break;
            }
            // Append the line onto the current paragraph
            for (var i = currentIndex; i < lineEndIndex; ++i) {
                currentParagraph.appendNode(inputParagraphNodes[i]);
            }
            currentIndex = lineEndIndex;
        }
    };
    ParagraphSplitter._isWhitespace = function (node) {
        switch (node.kind) {
            case "PlainText" /* PlainText */:
                var docPlainText = node;
                return ParagraphSplitter._whitespaceRegExp.test(docPlainText.text);
            default:
                return false;
        }
    };
    ParagraphSplitter._whitespaceRegExp = /^\s*$/;
    return ParagraphSplitter;
}());
exports.ParagraphSplitter = ParagraphSplitter;
//# sourceMappingURL=ParagraphSplitter.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/ParserContext.js":
/*!********************************************!*\
  !*** ../tsdoc/lib/parser/ParserContext.js ***!
  \********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var TextRange_1 = __webpack_require__(/*! ./TextRange */ "../tsdoc/lib/parser/TextRange.js");
var nodes_1 = __webpack_require__(/*! ../nodes */ "../tsdoc/lib/nodes/index.js");
var ParserMessageLog_1 = __webpack_require__(/*! ./ParserMessageLog */ "../tsdoc/lib/parser/ParserMessageLog.js");
/**
 * An internal data structure that tracks all the state being built up by the various
 * parser stages.
 */
var ParserContext = /** @class */ (function () {
    function ParserContext(configuration, sourceRange) {
        /**
         * The text range starting from the opening `/**` and ending with
         * the closing `*\/` delimiter.
         */
        this.commentRange = TextRange_1.TextRange.empty;
        /**
         * The text ranges corresponding to the lines of content inside the comment.
         */
        this.lines = [];
        /**
         * A complete list of all tokens that were extracted from the input lines.
         */
        this.tokens = [];
        this.configuration = configuration;
        this.sourceRange = sourceRange;
        this.docComment = new nodes_1.DocComment({ parserContext: this });
        this.log = new ParserMessageLog_1.ParserMessageLog();
    }
    return ParserContext;
}());
exports.ParserContext = ParserContext;
//# sourceMappingURL=ParserContext.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/ParserMessage.js":
/*!********************************************!*\
  !*** ../tsdoc/lib/parser/ParserMessage.js ***!
  \********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents an error or warning that occurred during parsing.
 */
var ParserMessage = /** @class */ (function () {
    function ParserMessage(parameters) {
        this.unformattedText = parameters.messageText;
        this.textRange = parameters.textRange;
        this.tokenSequence = parameters.tokenSequence;
        this.docNode = parameters.docNode;
        this._text = undefined;
    }
    /**
     * Generates a line/column prefix.  Example with line=2 and column=5
     * and message="An error occurred":
     * ```
     * "(2,5): An error occurred"
     * ```
     */
    ParserMessage._formatMessageText = function (message, range) {
        if (!message) {
            message = 'An unknown error occurred';
        }
        if (range.pos !== 0 || range.end !== 0) {
            // NOTE: This currently a potentially expensive operation, since TSDoc currently doesn't
            // have a full newline analysis for the input buffer.
            var location = range.getLocation(range.pos);
            if (location.line) {
                return "(" + location.line + "," + location.column + "): " + message;
            }
        }
        return message;
    };
    Object.defineProperty(ParserMessage.prototype, "text", {
        /**
         * The message text.
         */
        get: function () {
            if (this._text === undefined) {
                // NOTE: This currently a potentially expensive operation, since TSDoc currently doesn't
                // have a full newline analysis for the input buffer.
                this._text = ParserMessage._formatMessageText(this.unformattedText, this.textRange);
            }
            return this._text;
        },
        enumerable: true,
        configurable: true
    });
    ParserMessage.prototype.toString = function () {
        return this.text;
    };
    return ParserMessage;
}());
exports.ParserMessage = ParserMessage;
//# sourceMappingURL=ParserMessage.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/ParserMessageLog.js":
/*!***********************************************!*\
  !*** ../tsdoc/lib/parser/ParserMessageLog.js ***!
  \***********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ParserMessage_1 = __webpack_require__(/*! ./ParserMessage */ "../tsdoc/lib/parser/ParserMessage.js");
/**
 * Used to report errors and warnings that occurred during parsing.
 */
var ParserMessageLog = /** @class */ (function () {
    function ParserMessageLog() {
        this._messages = [];
    }
    Object.defineProperty(ParserMessageLog.prototype, "messages", {
        /**
         * The unfiltered list of all messages.
         */
        get: function () {
            return this._messages;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Append a message to the log.
     */
    ParserMessageLog.prototype.addMessage = function (parserMessage) {
        this._messages.push(parserMessage);
    };
    /**
     * Append a message associated with a TextRange.
     */
    ParserMessageLog.prototype.addMessageForTextRange = function (messageText, textRange) {
        this.addMessage(new ParserMessage_1.ParserMessage({
            messageText: messageText,
            textRange: textRange
        }));
    };
    /**
     * Append a message associated with a TokenSequence.
     */
    ParserMessageLog.prototype.addMessageForTokenSequence = function (messageText, tokenSequence, docNode) {
        this.addMessage(new ParserMessage_1.ParserMessage({
            messageText: messageText,
            textRange: tokenSequence.getContainingTextRange(),
            tokenSequence: tokenSequence,
            docNode: docNode
        }));
    };
    /**
     * Append a message associated with a TokenSequence.
     */
    ParserMessageLog.prototype.addMessageForDocErrorText = function (docErrorText) {
        var tokenSequence;
        if (docErrorText.excerpt) {
            // If there is an excerpt directly associated with the DocErrorText, highlight that:
            tokenSequence = docErrorText.excerpt.content;
        }
        else {
            // Otherwise we can use the errorLocation, but typically that is meant to give additional
            // details, not to indicate the primary location of the problem.
            tokenSequence = docErrorText.errorLocation;
        }
        this.addMessage(new ParserMessage_1.ParserMessage({
            messageText: docErrorText.errorMessage,
            textRange: tokenSequence.getContainingTextRange(),
            tokenSequence: tokenSequence,
            docNode: docErrorText
        }));
    };
    return ParserMessageLog;
}());
exports.ParserMessageLog = ParserMessageLog;
//# sourceMappingURL=ParserMessageLog.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/StringChecks.js":
/*!*******************************************!*\
  !*** ../tsdoc/lib/parser/StringChecks.js ***!
  \*******************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Helpers for validating various text string formats.
 */
var StringChecks = /** @class */ (function () {
    function StringChecks() {
    }
    /**
     * Tests whether the input string is a valid TSDoc tag name; if not, returns an error message.
     * TSDoc tag names start with an at-sign ("@") followed by ASCII letters using
     * "camelCase" capitalization.
     */
    StringChecks.explainIfInvalidTSDocTagName = function (tagName) {
        if (tagName[0] !== '@') {
            return 'A TSDoc tag name must start with an "@" symbol';
        }
        if (!StringChecks._tsdocTagNameRegExp.test(tagName)) {
            return 'A TSDoc tag name must start with a letter and contain only letters and numbers';
        }
        return undefined;
    };
    /**
     * Throws an exception if the input string is not a valid TSDoc tag name.
     * TSDoc tag names start with an at-sign ("@") followed by ASCII letters using
     * "camelCase" capitalization.
     */
    StringChecks.validateTSDocTagName = function (tagName) {
        var explanation = StringChecks.explainIfInvalidTSDocTagName(tagName);
        if (explanation) {
            throw new Error(explanation);
        }
    };
    /**
     * Tests whether the input string is a URL form supported inside an "@link" tag; if not,
     * returns an error message.
     */
    StringChecks.explainIfInvalidLinkUrl = function (url) {
        if (url.length === 0) {
            return 'The URL cannot be empty';
        }
        if (!StringChecks._urlSchemeRegExp.test(url)) {
            return 'An @link URL must begin with a scheme comprised only of letters and numbers followed by "://".'
                + ' (For general URLs, use an HTML "<a>" tag instead.)';
        }
        if (!StringChecks._urlSchemeAfterRegExp.test(url)) {
            return 'An @link URL must have at least one character after "://"';
        }
        return undefined;
    };
    /**
     * Tests whether the input string is a valid NPM package name.
     */
    StringChecks.explainIfInvalidPackageName = function (packageName) {
        if (packageName.length === 0) {
            return 'The package name cannot be an empty string';
        }
        if (!StringChecks._validPackageNameRegExp.test(packageName)) {
            return "The package name " + JSON.stringify(packageName) + " is not a valid package name";
        }
        return undefined;
    };
    /**
     * Tests whether the input string is a valid declaration reference import path.
     */
    StringChecks.explainIfInvalidImportPath = function (importPath, prefixedByPackageName) {
        if (importPath.length > 0) {
            if (importPath.indexOf('//') >= 0) {
                return 'An import path must not contain "//"';
            }
            if (importPath[importPath.length - 1] === '/') {
                return 'An import path must not end with "/"';
            }
            if (!prefixedByPackageName) {
                if (importPath[0] === '/') {
                    return 'An import path must not start with "/" unless prefixed by a package name';
                }
            }
        }
        return undefined;
    };
    /**
     * Returns true if the input string is a TSDoc system selector.
     */
    StringChecks.isSystemSelector = function (selector) {
        return StringChecks._systemSelectors.has(selector);
    };
    /**
     * Tests whether the input string is a valid ECMAScript identifier.
     * A precise check is extremely complicated and highly dependent on the standard version
     * and how faithfully the interpreter implements it, so here we use a conservative heuristic.
     */
    StringChecks.explainIfInvalidUnquotedIdentifier = function (identifier) {
        if (identifier.length === 0) {
            return 'The identifier cannot be an empty string';
        }
        if (StringChecks._identifierNotWordCharRegExp.test(identifier)) {
            return 'The identifier cannot non-word characters';
        }
        if (StringChecks._identifierNumberStartRegExp.test(identifier)) {
            return 'The identifier must not start with a number';
        }
        if (StringChecks.isSystemSelector(identifier)) {
            // We do this to avoid confusion about the declaration reference syntax rules.
            // For example if someone were to see "MyClass.(static:instance)" it would be unclear which
            // side the colon is the selector.
            return "The identifier \"" + identifier + "\" must be quoted because it is a TSDoc system selector name";
        }
        return undefined;
    };
    StringChecks._tsdocTagNameRegExp = /^@[a-z][a-z0-9]*$/i;
    StringChecks._urlSchemeRegExp = /^[a-z][a-z0-9]*\:\/\//i;
    StringChecks._urlSchemeAfterRegExp = /^[a-z][a-z0-9]*\:\/\/./i;
    StringChecks._identifierNotWordCharRegExp = /\W/u;
    StringChecks._identifierNumberStartRegExp = /^[0-9]/u;
    StringChecks._validPackageNameRegExp = /^(?:@[a-z0-9\-_\.]+\/)?[a-z0-9\-_\.]+$/i;
    StringChecks._systemSelectors = new Set([
        // For classes:
        'instance', 'static', 'constructor',
        // For merged declarations:
        'class', 'enum', 'function', 'interface', 'namespace', 'type', 'variable'
    ]);
    return StringChecks;
}());
exports.StringChecks = StringChecks;
//# sourceMappingURL=StringChecks.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/TSDocParser.js":
/*!******************************************!*\
  !*** ../tsdoc/lib/parser/TSDocParser.js ***!
  \******************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var TextRange_1 = __webpack_require__(/*! ./TextRange */ "../tsdoc/lib/parser/TextRange.js");
var ParserContext_1 = __webpack_require__(/*! ./ParserContext */ "../tsdoc/lib/parser/ParserContext.js");
var LineExtractor_1 = __webpack_require__(/*! ./LineExtractor */ "../tsdoc/lib/parser/LineExtractor.js");
var Tokenizer_1 = __webpack_require__(/*! ./Tokenizer */ "../tsdoc/lib/parser/Tokenizer.js");
var NodeParser_1 = __webpack_require__(/*! ./NodeParser */ "../tsdoc/lib/parser/NodeParser.js");
var TSDocParserConfiguration_1 = __webpack_require__(/*! ./TSDocParserConfiguration */ "../tsdoc/lib/parser/TSDocParserConfiguration.js");
var ParagraphSplitter_1 = __webpack_require__(/*! ./ParagraphSplitter */ "../tsdoc/lib/parser/ParagraphSplitter.js");
/**
 * The main API for parsing TSDoc comments.
 */
var TSDocParser = /** @class */ (function () {
    function TSDocParser(configuration) {
        if (configuration) {
            this.configuration = configuration;
        }
        else {
            this.configuration = new TSDocParserConfiguration_1.TSDocParserConfiguration();
        }
    }
    TSDocParser.prototype.parseString = function (text) {
        return this.parseRange(TextRange_1.TextRange.fromString(text));
    };
    TSDocParser.prototype.parseRange = function (range) {
        var parserContext = new ParserContext_1.ParserContext(this.configuration, range);
        if (LineExtractor_1.LineExtractor.extract(parserContext)) {
            parserContext.tokens = Tokenizer_1.Tokenizer.readTokens(parserContext.lines);
            var nodeParser = new NodeParser_1.NodeParser(parserContext);
            nodeParser.parse();
            ParagraphSplitter_1.ParagraphSplitter.splitParagraphs(parserContext.docComment);
        }
        return parserContext;
    };
    return TSDocParser;
}());
exports.TSDocParser = TSDocParser;
//# sourceMappingURL=TSDocParser.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/TSDocParserConfiguration.js":
/*!*******************************************************!*\
  !*** ../tsdoc/lib/parser/TSDocParserConfiguration.js ***!
  \*******************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var StandardTags_1 = __webpack_require__(/*! ../details/StandardTags */ "../tsdoc/lib/details/StandardTags.js");
/**
 * Part of the {@link TSDocParserConfiguration} object.
 */
var TSDocParserValidationConfiguration = /** @class */ (function () {
    function TSDocParserValidationConfiguration() {
        /**
         * Set `ignoreUndefinedTags` to true to silently ignore unrecognized tags,
         * instead of reporting a warning.
         *
         * @remarks
         * Normally the parser will issue errors when it encounters tag names that do not
         * have a corresponding definition in {@link TSDocParserConfiguration.tagDefinitions}.
         * This helps to catch common mistakes such as a misspelled tag.
         *
         * @defaultValue `false`
         */
        this.ignoreUndefinedTags = false;
        /**
         * Set `reportUnsupportedTags` to true to issue a warning for tags that are not
         * supported by your tool.
         *
         * @remarks
         * The TSDoc standard defines may tags.  By default it assumes that if your tool does
         * not implement one of these tags, then it will simply ignore it.  But sometimes this
         * may be misleading for developers. (For example, they might write an `@example` block
         * and then be surprised if it doesn't appear in the documentation output.).
         *
         * For a better experience, you can tell the parser which tags you support, and then it
         * will issue warnings wherever unsupported tags are used.  This is done using
         * {@link TSDocParserConfiguration.setSupportForTag}.  Note that calling that function
         * automatically sets `reportUnsupportedTags` to true.
         *
         * @defaultValue `false`
         */
        this.reportUnsupportedTags = false;
    }
    return TSDocParserValidationConfiguration;
}());
exports.TSDocParserValidationConfiguration = TSDocParserValidationConfiguration;
/**
 * Configuration for the TSDocParser.
 */
var TSDocParserConfiguration = /** @class */ (function () {
    function TSDocParserConfiguration() {
        this._tagDefinitions = [];
        this._tagDefinitionsByName = new Map();
        this._supportedTagDefinitions = new Set();
        this._validation = new TSDocParserValidationConfiguration();
        // Define all the standard tags
        this.addTagDefinitions(StandardTags_1.StandardTags.allDefinitions);
    }
    Object.defineProperty(TSDocParserConfiguration.prototype, "tagDefinitions", {
        /**
         * The TSDoc block tag names that will be interpreted as modifier tags.
         */
        get: function () {
            return this._tagDefinitions;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TSDocParserConfiguration.prototype, "supportedTagDefinitions", {
        /**
         * Returns the subset of {@link TSDocParserConfiguration.tagDefinitions}
         * that are supported in this configuration.
         *
         * @remarks
         * This property is only used when
         * {@link TSDocParserValidationConfiguration.reportUnsupportedTags} is enabled.
         */
        get: function () {
            var _this = this;
            return this.tagDefinitions.filter(function (x) { return _this.isTagSupported(x); });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TSDocParserConfiguration.prototype, "validation", {
        /**
         * Enable/disable validation checks performed by the parser.
         */
        get: function () {
            return this._validation;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Return the tag that was defined with the specified name, or undefined
     * if not found.
     */
    TSDocParserConfiguration.prototype.tryGetTagDefinition = function (tagName) {
        return this._tagDefinitionsByName.get(tagName.toUpperCase());
    };
    /**
     * Return the tag that was defined with the specified name, or undefined
     * if not found.
     */
    TSDocParserConfiguration.prototype.tryGetTagDefinitionWithUpperCase = function (alreadyUpperCaseTagName) {
        return this._tagDefinitionsByName.get(alreadyUpperCaseTagName);
    };
    /**
     * Define a new TSDoc tag to be recognized by the TSDocParser, and mark it as unsupported.
     * Use {@link TSDocParserConfiguration.setSupportForTag} to mark it as supported.
     *
     * @remarks
     * If a tag is "defined" this means that the parser recognizes it and understands its syntax.
     * Whereas if a tag is "supported", this means it is defined AND the application implements the tag.
     */
    TSDocParserConfiguration.prototype.addTagDefinition = function (tagDefinition) {
        var existingDefinition = this._tagDefinitionsByName.get(tagDefinition.tagNameWithUpperCase);
        if (existingDefinition === tagDefinition) {
            return;
        }
        if (existingDefinition) {
            throw new Error("A tag is already defined using the name " + existingDefinition.tagName);
        }
        this._tagDefinitions.push(tagDefinition);
        this._tagDefinitionsByName.set(tagDefinition.tagNameWithUpperCase, tagDefinition);
    };
    /**
     * Calls {@link TSDocParserConfiguration.addTagDefinition} for a list of definitions,
     * and optionally marks them as supported.
     * @param tagDefinitions - the definitions to be added
     * @param supported - if specified, calls the {@link TSDocParserConfiguration.setSupportForTag}
     *    method to mark the definitions as supported or unsupported
     */
    TSDocParserConfiguration.prototype.addTagDefinitions = function (tagDefinitions, supported) {
        for (var _i = 0, tagDefinitions_1 = tagDefinitions; _i < tagDefinitions_1.length; _i++) {
            var tagDefinition = tagDefinitions_1[_i];
            this.addTagDefinition(tagDefinition);
            if (supported !== undefined) {
                this.setSupportForTag(tagDefinition, supported);
            }
        }
    };
    /**
     * Returns true if the tag is supported in this configuration.
     */
    TSDocParserConfiguration.prototype.isTagSupported = function (tagDefinition) {
        this._requireTagToBeDefined(tagDefinition);
        return this._supportedTagDefinitions.has(tagDefinition);
    };
    /**
     * Specifies whether the tag definition is supported in this configuration.
     * The parser may issue warnings for unsupported tags.
     *
     * @remarks
     * If a tag is "defined" this means that the parser recognizes it and understands its syntax.
     * Whereas if a tag is "supported", this means it is defined AND the application implements the tag.
     *
     * This function automatically sets {@link TSDocParserValidationConfiguration.reportUnsupportedTags}
     * to true.
     */
    TSDocParserConfiguration.prototype.setSupportForTag = function (tagDefinition, supported) {
        this._requireTagToBeDefined(tagDefinition);
        if (supported) {
            this._supportedTagDefinitions.add(tagDefinition);
        }
        else {
            this._supportedTagDefinitions.delete(tagDefinition);
        }
        this.validation.reportUnsupportedTags = true;
    };
    /**
     * Calls {@link TSDocParserConfiguration.setSupportForTag} for multiple tag definitions.
     */
    TSDocParserConfiguration.prototype.setSupportForTags = function (tagDefinitions, supported) {
        for (var _i = 0, tagDefinitions_2 = tagDefinitions; _i < tagDefinitions_2.length; _i++) {
            var tagDefinition = tagDefinitions_2[_i];
            this.setSupportForTag(tagDefinition, supported);
        }
    };
    TSDocParserConfiguration.prototype._requireTagToBeDefined = function (tagDefinition) {
        var matching = this._tagDefinitionsByName.get(tagDefinition.tagNameWithUpperCase);
        if (matching) {
            if (matching === tagDefinition) {
                return;
            }
        }
        throw new Error('The specified TSDocTagDefinition is not defined for this TSDocParserConfiguration');
    };
    return TSDocParserConfiguration;
}());
exports.TSDocParserConfiguration = TSDocParserConfiguration;
//# sourceMappingURL=TSDocParserConfiguration.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/TSDocTagDefinition.js":
/*!*************************************************!*\
  !*** ../tsdoc/lib/parser/TSDocTagDefinition.js ***!
  \*************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var StringChecks_1 = __webpack_require__(/*! ./StringChecks */ "../tsdoc/lib/parser/StringChecks.js");
/**
 * Determines the type of syntax for a TSDocTagDefinition
 */
var TSDocTagSyntaxKind;
(function (TSDocTagSyntaxKind) {
    /**
     * The tag is intended to be an inline tag.  For example: `{@link}`.
     */
    TSDocTagSyntaxKind[TSDocTagSyntaxKind["InlineTag"] = 0] = "InlineTag";
    /**
     * The tag is intended to be a block tag that starts a new documentation
     * section.  For example: `@remarks`
     */
    TSDocTagSyntaxKind[TSDocTagSyntaxKind["BlockTag"] = 1] = "BlockTag";
    /**
     * The tag is intended to be a modifier tag whose presences indicates
     * an aspect of the associated API item.  For example: `@internal`
     */
    TSDocTagSyntaxKind[TSDocTagSyntaxKind["ModifierTag"] = 2] = "ModifierTag";
})(TSDocTagSyntaxKind = exports.TSDocTagSyntaxKind || (exports.TSDocTagSyntaxKind = {}));
/**
 * Defines a TSDoc tag that will be understood by the TSDocParser.
 */
var TSDocTagDefinition = /** @class */ (function () {
    function TSDocTagDefinition(parameters) {
        StringChecks_1.StringChecks.validateTSDocTagName(parameters.tagName);
        this.tagName = parameters.tagName;
        this.tagNameWithUpperCase = parameters.tagName.toUpperCase();
        this.syntaxKind = parameters.syntaxKind;
        this.standardization = parameters.standardization
            || "None" /* None */;
        this.allowMultiple = !!parameters.allowMultiple;
    }
    return TSDocTagDefinition;
}());
exports.TSDocTagDefinition = TSDocTagDefinition;
//# sourceMappingURL=TSDocTagDefinition.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/TextRange.js":
/*!****************************************!*\
  !*** ../tsdoc/lib/parser/TextRange.js ***!
  \****************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Efficiently references a range of text from a string buffer.
 */
var TextRange = /** @class */ (function () {
    function TextRange(buffer, pos, end) {
        this.buffer = buffer;
        this.pos = pos;
        this.end = end;
        this._validateBounds();
    }
    /**
     * Constructs a TextRange that corresponds to an entire string object.
     */
    TextRange.fromString = function (buffer) {
        return new TextRange(buffer, 0, buffer.length);
    };
    /**
     * Constructs a TextRange that corresponds to an entire string object.
     */
    TextRange.fromStringRange = function (buffer, pos, end) {
        return new TextRange(buffer, pos, end);
    };
    /**
     * Constructs a TextRange that corresponds to a different range of an existing buffer.
     */
    TextRange.prototype.getNewRange = function (pos, end) {
        return new TextRange(this.buffer, pos, end);
    };
    /**
     * Returns true if the length of the range is zero.  Note that the object reference may not
     * be equal to `TextRange.empty`, and the buffer may be different.
     */
    TextRange.prototype.isEmpty = function () {
        return this.pos === this.end;
    };
    /**
     * Returns the range from the associated string buffer.
     */
    TextRange.prototype.toString = function () {
        return this.buffer.substring(this.pos, this.end);
    };
    /**
     * Returns a debugging dump of the range, indicated via custom delimiters.
     * @remarks
     * For example if the delimiters are "[" and "]", and the range is 3..5 inside "1234567",
     * then the output would be "12[345]67".
     */
    TextRange.prototype.getDebugDump = function (posDelimiter, endDelimiter) {
        return this.buffer.substring(0, this.pos)
            + posDelimiter
            + this.buffer.substring(this.pos, this.end)
            + endDelimiter
            + this.buffer.substring(this.end);
    };
    /**
     * Calculates the line and column number for the specified offset into the buffer.
     *
     * @remarks
     * This is a potentially expensive operation.
     *
     * @param index - an integer offset
     * @param buffer - the buffer
     */
    TextRange.prototype.getLocation = function (index) {
        if (index < 0 || index > this.buffer.length) {
            // No match
            return { line: 0, column: 0 };
        }
        // TODO: Consider caching or optimizing this somehow
        var line = 1;
        var column = 1;
        var currentIndex = 0;
        while (currentIndex < index) {
            var current = this.buffer[currentIndex];
            ++currentIndex;
            if (current === '\r') { // CR
                // Ignore '\r' and assume it will always have an accompanying '\n'
                continue;
            }
            if (current === '\n') { // LF
                ++line;
                column = 1;
            }
            else {
                // NOTE: For consistency with the TypeScript compiler, a tab character is assumed
                // to advance by one column
                ++column;
            }
        }
        return { line: line, column: column };
    };
    TextRange.prototype._validateBounds = function () {
        if (this.pos < 0) {
            throw new Error('TextRange.pos cannot be negative');
        }
        if (this.end < 0) {
            throw new Error('TextRange.end cannot be negative');
        }
        if (this.end < this.pos) {
            throw new Error('TextRange.end cannot be smaller than TextRange.pos');
        }
        if (this.pos > this.buffer.length) {
            throw new Error('TextRange.pos cannot exceed the associated text buffer length');
        }
        if (this.end > this.buffer.length) {
            throw new Error('TextRange.end cannot exceed the associated text buffer length');
        }
    };
    /**
     * Used to represent an empty or unknown range.
     */
    TextRange.empty = new TextRange('', 0, 0);
    return TextRange;
}());
exports.TextRange = TextRange;
//# sourceMappingURL=TextRange.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/Token.js":
/*!************************************!*\
  !*** ../tsdoc/lib/parser/Token.js ***!
  \************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Distinguishes different types of Token objects.
 */
var TokenKind;
(function (TokenKind) {
    /**
     * A token representing the end of the input.  The Token.range will be an empty range
     * at the end of the provided input.
     */
    TokenKind[TokenKind["EndOfInput"] = 2001] = "EndOfInput";
    /**
     * A token representing a virtual newline.
     * The Token.range will be an empty range, because the actual newline character may
     * be noncontiguous due to the doc comment delimiter trimming.
     */
    TokenKind[TokenKind["Newline"] = 2002] = "Newline";
    /**
     * A token representing one or more spaces and tabs (but not newlines or end of input).
     */
    TokenKind[TokenKind["Spacing"] = 2003] = "Spacing";
    /**
     * A token representing one or more ASCII letters, numbers, and underscores.
     */
    TokenKind[TokenKind["AsciiWord"] = 2004] = "AsciiWord";
    /**
     * A single ASCII character that behaves like punctuation, e.g. doesn't need whitespace
     * around it when adjacent to a letter.  The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["OtherPunctuation"] = 2005] = "OtherPunctuation";
    /**
     * A token representing a sequence of non-ASCII printable characters that are not punctuation.
     */
    TokenKind[TokenKind["Other"] = 2006] = "Other";
    /**
     * The backslash character `\`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["Backslash"] = 2007] = "Backslash";
    /**
     * The less-than character `<`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["LessThan"] = 2008] = "LessThan";
    /**
     * The greater-than character `>`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["GreaterThan"] = 2009] = "GreaterThan";
    /**
     * The equals character `=`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["Equals"] = 2010] = "Equals";
    /**
     * The single-quote character `'`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["SingleQuote"] = 2011] = "SingleQuote";
    /**
     * The double-quote character `"`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["DoubleQuote"] = 2012] = "DoubleQuote";
    /**
     * The slash character `/`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["Slash"] = 2013] = "Slash";
    /**
     * The hyphen character `-`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["Hyphen"] = 2014] = "Hyphen";
    /**
     * The at-sign character `@`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["AtSign"] = 2015] = "AtSign";
    /**
     * The left curly bracket character `{`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["LeftCurlyBracket"] = 2016] = "LeftCurlyBracket";
    /**
     * The right curly bracket character `}`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["RightCurlyBracket"] = 2017] = "RightCurlyBracket";
    /**
     * The backtick character.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["Backtick"] = 2018] = "Backtick";
    /**
     * The period character.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["Period"] = 2019] = "Period";
    /**
     * The colon character.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["Colon"] = 2020] = "Colon";
    /**
     * The comma character.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["Comma"] = 2021] = "Comma";
    /**
     * The left square bracket character.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["LeftSquareBracket"] = 2022] = "LeftSquareBracket";
    /**
     * The right square bracket character.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["RightSquareBracket"] = 2023] = "RightSquareBracket";
    /**
     * The pipe character `|`.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["Pipe"] = 2024] = "Pipe";
    /**
     * The left parenthesis character.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["LeftParenthesis"] = 2025] = "LeftParenthesis";
    /**
     * The right parenthesis character.
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["RightParenthesis"] = 2026] = "RightParenthesis";
    /**
     * The pound character ("#").
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["PoundSymbol"] = 2027] = "PoundSymbol";
    /**
     * The plus character ("+").
     * The Token.range will always be a string of length 1.
     */
    TokenKind[TokenKind["Plus"] = 2028] = "Plus";
})(TokenKind = exports.TokenKind || (exports.TokenKind = {}));
/**
 * Represents a contiguous range of characters extracted from one of the doc comment lines
 * being processed by the Tokenizer.  There is a token representing a newline, but otherwise
 * a single token cannot span multiple lines.
 */
var Token = /** @class */ (function () {
    function Token(kind, range, line) {
        this.kind = kind;
        this.range = range;
        this.line = line;
    }
    Token.prototype.toString = function () {
        if (this.kind === TokenKind.Newline) {
            return '\n';
        }
        return this.range.toString();
    };
    return Token;
}());
exports.Token = Token;
//# sourceMappingURL=Token.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/TokenReader.js":
/*!******************************************!*\
  !*** ../tsdoc/lib/parser/TokenReader.js ***!
  \******************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Token_1 = __webpack_require__(/*! ./Token */ "../tsdoc/lib/parser/Token.js");
var TokenSequence_1 = __webpack_require__(/*! ./TokenSequence */ "../tsdoc/lib/parser/TokenSequence.js");
/**
 * Manages a stream of tokens that are read by the parser.
 *
 * @remarks
 * Use TokenReader.readToken() to read a token and advance the stream pointer.
 * Use TokenReader.peekToken() to preview the next token.
 * Use TokenReader.createMarker() and backtrackToMarker() to rewind to an earlier point.
 * Whenever readToken() is called, the token is added to an accumulated TokenSequence
 * that can be extracted by calling extractAccumulatedSequence().
 */
var TokenReader = /** @class */ (function () {
    function TokenReader(parserContext, embeddedTokenSequence) {
        this._parserContext = parserContext;
        this.tokens = parserContext.tokens;
        if (embeddedTokenSequence) {
            if (embeddedTokenSequence.parserContext !== this._parserContext) {
                throw new Error('The embeddedTokenSequence must use the same parser context');
            }
            this._readerStartIndex = embeddedTokenSequence.startIndex;
            this._readerEndIndex = embeddedTokenSequence.endIndex;
        }
        else {
            this._readerStartIndex = 0;
            this._readerEndIndex = this.tokens.length;
        }
        this._currentIndex = this._readerStartIndex;
        this._accumulatedStartIndex = this._readerStartIndex;
    }
    /**
     * Extracts and returns the TokenSequence that was accumulated so far by calls to readToken().
     * The next call to readToken() will start a new accumulated sequence.
     */
    TokenReader.prototype.extractAccumulatedSequence = function () {
        if (this._accumulatedStartIndex === this._currentIndex) {
            // If this happens, it indicates a parser bug:
            throw new Error('Parser assertion failed: The queue should not be empty when'
                + ' extractAccumulatedSequence() is called');
        }
        var sequence = new TokenSequence_1.TokenSequence({
            parserContext: this._parserContext,
            startIndex: this._accumulatedStartIndex,
            endIndex: this._currentIndex
        });
        this._accumulatedStartIndex = this._currentIndex;
        return sequence;
    };
    /**
     * Returns true if the accumulated sequence has any tokens yet.  This will be false
     * when the TokenReader starts, and it will be false immediately after a call
     * to extractAccumulatedSequence().  Otherwise, it will become true whenever readToken()
     * is called.
     */
    TokenReader.prototype.isAccumulatedSequenceEmpty = function () {
        return this._accumulatedStartIndex === this._currentIndex;
    };
    /**
     * Like extractAccumulatedSequence(), but returns undefined if nothing has been
     * accumulated yet.
     */
    TokenReader.prototype.tryExtractAccumulatedSequence = function () {
        if (this.isAccumulatedSequenceEmpty()) {
            return undefined;
        }
        return this.extractAccumulatedSequence();
    };
    /**
     * Asserts that isAccumulatedSequenceEmpty() should return false.  If not, an exception
     * is throw indicating a parser bug.
     */
    TokenReader.prototype.assertAccumulatedSequenceIsEmpty = function () {
        if (!this.isAccumulatedSequenceEmpty()) {
            // If this happens, it indicates a parser bug:
            var sequence = new TokenSequence_1.TokenSequence({
                parserContext: this._parserContext,
                startIndex: this._accumulatedStartIndex,
                endIndex: this._currentIndex
            });
            var tokenStrings = sequence.tokens.map(function (x) { return x.toString(); });
            throw new Error('Parser assertion failed: The queue should be empty, but it contains:\n'
                + JSON.stringify(tokenStrings));
        }
    };
    /**
     * Returns the next token that would be returned by _readToken(), without
     * consuming anything.
     */
    TokenReader.prototype.peekToken = function () {
        return this.tokens[this._currentIndex];
    };
    /**
     * Returns the TokenKind for the next token that would be returned by _readToken(), without
     * consuming anything.
     */
    TokenReader.prototype.peekTokenKind = function () {
        if (this._currentIndex >= this._readerEndIndex) {
            return Token_1.TokenKind.EndOfInput;
        }
        return this.tokens[this._currentIndex].kind;
    };
    /**
     * Like peekTokenKind(), but looks ahead two tokens.
     */
    TokenReader.prototype.peekTokenAfterKind = function () {
        if (this._currentIndex + 1 >= this._readerEndIndex) {
            return Token_1.TokenKind.EndOfInput;
        }
        return this.tokens[this._currentIndex + 1].kind;
    };
    /**
     * Like peekTokenKind(), but looks ahead three tokens.
     */
    TokenReader.prototype.peekTokenAfterAfterKind = function () {
        if (this._currentIndex + 2 >= this._readerEndIndex) {
            return Token_1.TokenKind.EndOfInput;
        }
        return this.tokens[this._currentIndex + 2].kind;
    };
    /**
     * Extract the next token from the input stream and return it.
     * The token will also be appended to the accumulated sequence, which can
     * later be accessed via extractAccumulatedSequence().
     */
    TokenReader.prototype.readToken = function () {
        if (this._currentIndex >= this._readerEndIndex) {
            // If this happens, it's a parser bug
            throw new Error('Cannot read past end of stream');
        }
        var token = this.tokens[this._currentIndex];
        if (token.kind === Token_1.TokenKind.EndOfInput) {
            // We don't allow reading the EndOfInput token, because we want _peekToken()
            // to be always guaranteed to return a valid result.
            // If this happens, it's a parser bug
            throw new Error('The EndOfInput token cannot be read');
        }
        this._currentIndex++;
        return token;
    };
    /**
     * Returns the kind of the token immediately before the current token.
     */
    TokenReader.prototype.peekPreviousTokenKind = function () {
        if (this._currentIndex === 0) {
            return Token_1.TokenKind.EndOfInput;
        }
        return this.tokens[this._currentIndex - 1].kind;
    };
    /**
     * Remembers the current position in the stream.
     */
    TokenReader.prototype.createMarker = function () {
        return this._currentIndex;
    };
    /**
     * Rewinds the stream pointer to a previous position in the stream.
     */
    TokenReader.prototype.backtrackToMarker = function (marker) {
        if (marker > this._currentIndex) {
            // If this happens, it's a parser bug
            throw new Error('The marker has expired');
        }
        this._currentIndex = marker;
        if (marker < this._accumulatedStartIndex) {
            this._accumulatedStartIndex = marker;
        }
    };
    return TokenReader;
}());
exports.TokenReader = TokenReader;
//# sourceMappingURL=TokenReader.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/TokenSequence.js":
/*!********************************************!*\
  !*** ../tsdoc/lib/parser/TokenSequence.js ***!
  \********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var TextRange_1 = __webpack_require__(/*! ./TextRange */ "../tsdoc/lib/parser/TextRange.js");
/**
 * Represents a sequence of tokens extracted from `ParserContext.tokens`.
 * This sequence is defined by a starting index and ending index into that array.
 */
var TokenSequence = /** @class */ (function () {
    function TokenSequence(parameters) {
        this.parserContext = parameters.parserContext;
        this._startIndex = parameters.startIndex;
        this._endIndex = parameters.endIndex;
        this._validateBounds();
    }
    /**
     * Constructs a TokenSequence object with no tokens.
     */
    TokenSequence.createEmpty = function (parserContext) {
        return new TokenSequence({ parserContext: parserContext, startIndex: 0, endIndex: 0 });
    };
    Object.defineProperty(TokenSequence.prototype, "startIndex", {
        /**
         * The starting index into the associated `ParserContext.tokens` list.
         */
        get: function () {
            return this._startIndex;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TokenSequence.prototype, "endIndex", {
        /**
         * The (non-inclusive) ending index into the associated `ParserContext.tokens` list.
         */
        get: function () {
            return this._endIndex;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TokenSequence.prototype, "tokens", {
        get: function () {
            return this.parserContext.tokens.slice(this._startIndex, this._endIndex);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Constructs a TokenSequence that corresponds to a different range of tokens,
     * e.g. a subrange.
     */
    TokenSequence.prototype.getNewSequence = function (startIndex, endIndex) {
        return new TokenSequence({
            parserContext: this.parserContext,
            startIndex: startIndex,
            endIndex: endIndex
        });
    };
    /**
     * Returns a TextRange that includes all tokens in the sequence (including any additional
     * characters between doc comment lines).
     */
    TokenSequence.prototype.getContainingTextRange = function () {
        if (this.isEmpty()) {
            return TextRange_1.TextRange.empty;
        }
        return this.parserContext.sourceRange.getNewRange(this.parserContext.tokens[this._startIndex].range.pos, this.parserContext.tokens[this._endIndex - 1].range.end);
    };
    TokenSequence.prototype.isEmpty = function () {
        return this._startIndex === this._endIndex;
    };
    /**
     * Returns the concatenated text of all the tokens.
     */
    TokenSequence.prototype.toString = function () {
        return this.tokens.map(function (x) { return x.toString(); }).join('');
    };
    TokenSequence.prototype._validateBounds = function () {
        if (this.startIndex < 0) {
            throw new Error('TokenSequence.startIndex cannot be negative');
        }
        if (this.endIndex < 0) {
            throw new Error('TokenSequence.endIndex cannot be negative');
        }
        if (this.endIndex < this.startIndex) {
            throw new Error('TokenSequence.endIndex cannot be smaller than TokenSequence.startIndex');
        }
        if (this.startIndex > this.parserContext.tokens.length) {
            throw new Error('TokenSequence.startIndex cannot exceed the associated token array');
        }
        if (this.endIndex > this.parserContext.tokens.length) {
            throw new Error('TokenSequence.endIndex cannot exceed the associated token array');
        }
    };
    return TokenSequence;
}());
exports.TokenSequence = TokenSequence;
//# sourceMappingURL=TokenSequence.js.map

/***/ }),

/***/ "../tsdoc/lib/parser/Tokenizer.js":
/*!****************************************!*\
  !*** ../tsdoc/lib/parser/Tokenizer.js ***!
  \****************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var TextRange_1 = __webpack_require__(/*! ./TextRange */ "../tsdoc/lib/parser/TextRange.js");
var Token_1 = __webpack_require__(/*! ./Token */ "../tsdoc/lib/parser/Token.js");
var Tokenizer = /** @class */ (function () {
    function Tokenizer() {
    }
    /**
     * Given a list of input lines, this returns an array of extracted tokens.
     * The last token will always be TokenKind.EndOfInput.
     */
    Tokenizer.readTokens = function (lines) {
        Tokenizer._ensureInitialized();
        var tokens = [];
        var lastLine = undefined;
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            Tokenizer._pushTokensForLine(tokens, line);
            lastLine = line;
        }
        if (lastLine) {
            tokens.push(new Token_1.Token(Token_1.TokenKind.EndOfInput, lastLine.getNewRange(lastLine.end, lastLine.end), lastLine));
        }
        else {
            tokens.push(new Token_1.Token(Token_1.TokenKind.EndOfInput, TextRange_1.TextRange.empty, TextRange_1.TextRange.empty));
        }
        return tokens;
    };
    /**
     * Returns true if the token is a CommonMark punctuation character.
     * These are basically all the ASCII punctuation characters.
     */
    Tokenizer.isPunctuation = function (tokenKind) {
        Tokenizer._ensureInitialized();
        return Tokenizer._punctuationTokens[tokenKind] || false;
    };
    Tokenizer._pushTokensForLine = function (tokens, line) {
        var buffer = line.buffer;
        var end = line.end;
        var bufferIndex = line.pos;
        var tokenKind = undefined;
        var tokenPos = bufferIndex;
        while (bufferIndex < end) {
            // Read a character and determine its kind
            var charCode = buffer.charCodeAt(bufferIndex);
            var characterKind = Tokenizer._charCodeMap[charCode];
            if (characterKind === undefined) {
                characterKind = Token_1.TokenKind.Other;
            }
            // Can we append to an existing token?  Yes if:
            // 1. There is an existing token, AND
            // 2. It is the same kind of token, AND
            // 3. It's not punctuation (which is always one character)
            if (tokenKind !== undefined
                && characterKind === tokenKind
                && Tokenizer._isMultiCharacterToken(tokenKind)) {
                // yes, append
            }
            else {
                // Is there a previous completed token to push?
                if (tokenKind !== undefined) {
                    tokens.push(new Token_1.Token(tokenKind, line.getNewRange(tokenPos, bufferIndex), line));
                }
                tokenPos = bufferIndex;
                tokenKind = characterKind;
            }
            ++bufferIndex;
        }
        // Is there a previous completed token to push?
        if (tokenKind !== undefined) {
            tokens.push(new Token_1.Token(tokenKind, line.getNewRange(tokenPos, bufferIndex), line));
        }
        tokens.push(new Token_1.Token(Token_1.TokenKind.Newline, line.getNewRange(line.end, line.end), line));
    };
    /**
     * Returns true if the token can be comprised of multiple characters
     */
    Tokenizer._isMultiCharacterToken = function (kind) {
        switch (kind) {
            case Token_1.TokenKind.Spacing:
            case Token_1.TokenKind.AsciiWord:
            case Token_1.TokenKind.Other:
                return true;
        }
        return false;
    };
    Tokenizer._ensureInitialized = function () {
        if (Tokenizer._charCodeMap) {
            return;
        }
        Tokenizer._charCodeMap = {};
        Tokenizer._punctuationTokens = {};
        // All Markdown punctuation characters
        var punctuation = Tokenizer._commonMarkPunctuationCharacters;
        for (var i = 0; i < punctuation.length; ++i) {
            var charCode = punctuation.charCodeAt(i);
            Tokenizer._charCodeMap[charCode] = Token_1.TokenKind.OtherPunctuation;
        }
        // Special symbols
        // !"#$%&\'()*+,\-.\/:;<=>?@[\\]^_`{|}~
        var specialMap = {
            '\\': Token_1.TokenKind.Backslash,
            '<': Token_1.TokenKind.LessThan,
            '>': Token_1.TokenKind.GreaterThan,
            '=': Token_1.TokenKind.Equals,
            '\'': Token_1.TokenKind.SingleQuote,
            '"': Token_1.TokenKind.DoubleQuote,
            '/': Token_1.TokenKind.Slash,
            '-': Token_1.TokenKind.Hyphen,
            '@': Token_1.TokenKind.AtSign,
            '{': Token_1.TokenKind.LeftCurlyBracket,
            '}': Token_1.TokenKind.RightCurlyBracket,
            '`': Token_1.TokenKind.Backtick,
            '.': Token_1.TokenKind.Period,
            ':': Token_1.TokenKind.Colon,
            ',': Token_1.TokenKind.Comma,
            '[': Token_1.TokenKind.LeftSquareBracket,
            ']': Token_1.TokenKind.RightSquareBracket,
            '|': Token_1.TokenKind.Pipe,
            '(': Token_1.TokenKind.LeftParenthesis,
            ')': Token_1.TokenKind.RightParenthesis,
            '#': Token_1.TokenKind.PoundSymbol,
            '+': Token_1.TokenKind.Plus
        };
        for (var _i = 0, _a = Object.getOwnPropertyNames(specialMap); _i < _a.length; _i++) {
            var key = _a[_i];
            Tokenizer._charCodeMap[key.charCodeAt(0)] = specialMap[key];
            Tokenizer._punctuationTokens[specialMap[key]] = true;
        }
        Tokenizer._punctuationTokens[Token_1.TokenKind.OtherPunctuation] = true;
        var word = Tokenizer._wordCharacters;
        for (var i = 0; i < word.length; ++i) {
            var charCode = word.charCodeAt(i);
            Tokenizer._charCodeMap[charCode] = Token_1.TokenKind.AsciiWord;
        }
        Tokenizer._charCodeMap[' '.charCodeAt(0)] = Token_1.TokenKind.Spacing;
        Tokenizer._charCodeMap['\t'.charCodeAt(0)] = Token_1.TokenKind.Spacing;
    };
    Tokenizer._commonMarkPunctuationCharacters = '!"#$%&\'()*+,\-.\/:;<=>?@[\\]^`{|}~';
    Tokenizer._wordCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    return Tokenizer;
}());
exports.Tokenizer = Tokenizer;
//# sourceMappingURL=Tokenizer.js.map

/***/ }),

/***/ "../tsdoc/lib/renderers/PlainTextRenderer.js":
/*!***************************************************!*\
  !*** ../tsdoc/lib/renderers/PlainTextRenderer.js ***!
  \***************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = __webpack_require__(/*! ../nodes */ "../tsdoc/lib/nodes/index.js");
/**
 * Renders a DocNode tree as plain text, without any rich text formatting or markup.
 */
var PlainTextRenderer = /** @class */ (function () {
    function PlainTextRenderer() {
    }
    PlainTextRenderer.hasAnyTextContent = function (nodeOrNodes) {
        if (nodeOrNodes instanceof nodes_1.DocNode) {
            nodeOrNodes = [nodeOrNodes];
        }
        for (var _i = 0, nodeOrNodes_1 = nodeOrNodes; _i < nodeOrNodes_1.length; _i++) {
            var node = nodeOrNodes_1[_i];
            switch (node.kind) {
                case "FencedCode" /* FencedCode */:
                case "CodeSpan" /* CodeSpan */:
                case "EscapedText" /* EscapedText */:
                case "LinkTag" /* LinkTag */:
                    return true;
                case "PlainText" /* PlainText */:
                    var docPlainText = node;
                    // Is there at least one non-spacing character?
                    if (docPlainText.text.trim().length > 0) {
                        return true;
                    }
                    break;
            }
            if (node instanceof nodes_1.DocNodeContainer) {
                for (var _a = 0, _b = node.getChildNodes(); _a < _b.length; _a++) {
                    var childNode = _b[_a];
                    if (this.hasAnyTextContent(childNode)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    return PlainTextRenderer;
}());
exports.PlainTextRenderer = PlainTextRenderer;
//# sourceMappingURL=PlainTextRenderer.js.map

/***/ }),

/***/ "../tsdoc/lib/transforms/DocNodeTransforms.js":
/*!****************************************************!*\
  !*** ../tsdoc/lib/transforms/DocNodeTransforms.js ***!
  \****************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var TrimSpacesTransform_1 = __webpack_require__(/*! ./TrimSpacesTransform */ "../tsdoc/lib/transforms/TrimSpacesTransform.js");
/**
 * Helper functions that transform DocNode trees.
 */
var DocNodeTransforms = /** @class */ (function () {
    function DocNodeTransforms() {
    }
    /**
     * trimSpacesInParagraphNodes() collapses extra spacing characters from plain text nodes.
     *
     * @remark
     * This is useful when emitting HTML, where any number of spaces are equivalent
     * to a single space.  It's also useful when emitting Markdown, where spaces
     * can be misinterpreted as an indented code block.
     *
     * For example, we might transform this:
     *
     * ```
     * nodes: [
     *   { kind: PlainText, text: "   Here   are some   " },
     *   { kind: SoftBreak }
     *   { kind: PlainText, text: "   words" },
     *   { kind: SoftBreak }
     *   { kind: InlineTag, text: "{\@inheritDoc}" },
     *   { kind: PlainText, text: "to process." },
     *   { kind: PlainText, text: "  " },
     *   { kind: PlainText, text: "  " }
     * ]
     * ```
     *
     * ...to this:
     *
     * ```
     * nodes: [
     *   { kind: PlainText, text: "Here are some " },
     *   { kind: PlainText, text: "words " },
     *   { kind: InlineTag, text: "{\@inheritDoc}" },
     *   { kind: PlainText, text: "to process." }
     * ]
     * ```
     *
     * Note that in this example, `"words "` is not merged with the preceding node because
     * its DocPlainText.excerpt cannot span multiple lines.
     *
     * @param docParagraph - a DocParagraph containing nodes to be transformed
     * @returns The transformed child nodes.
     */
    DocNodeTransforms.trimSpacesInParagraph = function (docParagraph) {
        return TrimSpacesTransform_1.TrimSpacesTransform.transform(docParagraph);
    };
    return DocNodeTransforms;
}());
exports.DocNodeTransforms = DocNodeTransforms;
//# sourceMappingURL=DocNodeTransforms.js.map

/***/ }),

/***/ "../tsdoc/lib/transforms/TrimSpacesTransform.js":
/*!******************************************************!*\
  !*** ../tsdoc/lib/transforms/TrimSpacesTransform.js ***!
  \******************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = __webpack_require__(/*! ../nodes */ "../tsdoc/lib/nodes/index.js");
var Excerpt_1 = __webpack_require__(/*! ../parser/Excerpt */ "../tsdoc/lib/parser/Excerpt.js");
/**
 * Implementation of DocNodeTransforms.trimSpacesInParagraphNodes()
 */
var TrimSpacesTransform = /** @class */ (function () {
    function TrimSpacesTransform() {
    }
    TrimSpacesTransform.transform = function (docParagraph) {
        var transformedNodes = [];
        // Whether the next nonempty node to be added needs a space before it
        var pendingSpace = false;
        // The DocPlainText node that we're currently accumulating
        var accumulatedPlainTextNode = undefined;
        // We always trim leading whitespace for a paragraph.  This flag gets set to true
        // as soon as nonempty content is encountered.
        var finishedSkippingLeadingSpaces = false;
        for (var _i = 0, _a = docParagraph.nodes; _i < _a.length; _i++) {
            var node = _a[_i];
            switch (node.kind) {
                case "PlainText" /* PlainText */:
                    var docPlainText = node;
                    var startedWithSpace = /^\s/.test(docPlainText.text);
                    var endedWithSpace = /\s$/.test(docPlainText.text);
                    var collapsedText = docPlainText.text.replace(/\s+/g, ' ').trim();
                    if (startedWithSpace && finishedSkippingLeadingSpaces) {
                        pendingSpace = true;
                    }
                    if (collapsedText.length > 0) {
                        if (accumulatedPlainTextNode) {
                            // If this node can't be merged, then eject it
                            if (!TrimSpacesTransform._canMergeExcerpts(accumulatedPlainTextNode.excerpt, docPlainText.excerpt)) {
                                transformedNodes.push(new nodes_1.DocPlainText(accumulatedPlainTextNode));
                                accumulatedPlainTextNode = undefined;
                            }
                        }
                        // If we haven't started an accumulatedPlainTextNode, create it now
                        if (!accumulatedPlainTextNode) {
                            accumulatedPlainTextNode = {
                                excerpt: undefined,
                                text: ''
                            };
                        }
                        if (pendingSpace) {
                            accumulatedPlainTextNode.text += ' ';
                            pendingSpace = false;
                        }
                        accumulatedPlainTextNode.text += collapsedText;
                        accumulatedPlainTextNode.excerpt = TrimSpacesTransform._mergeExcerpts(accumulatedPlainTextNode.excerpt, docPlainText.excerpt);
                        finishedSkippingLeadingSpaces = true;
                    }
                    if (endedWithSpace && finishedSkippingLeadingSpaces) {
                        pendingSpace = true;
                    }
                    break;
                case "SoftBreak" /* SoftBreak */:
                    if (finishedSkippingLeadingSpaces) {
                        pendingSpace = true;
                    }
                    break;
                default:
                    if (pendingSpace) {
                        // If we haven't started an accumulatedPlainTextNode, create it now
                        if (!accumulatedPlainTextNode) {
                            accumulatedPlainTextNode = {
                                excerpt: undefined,
                                text: ''
                            };
                        }
                        accumulatedPlainTextNode.text += ' ';
                        pendingSpace = false;
                    }
                    // Push the accumulated text
                    if (accumulatedPlainTextNode) {
                        transformedNodes.push(new nodes_1.DocPlainText(accumulatedPlainTextNode));
                        accumulatedPlainTextNode = undefined;
                    }
                    transformedNodes.push(node);
                    finishedSkippingLeadingSpaces = true;
            }
        }
        // Push the accumulated text
        if (accumulatedPlainTextNode) {
            transformedNodes.push(new nodes_1.DocPlainText(accumulatedPlainTextNode));
            accumulatedPlainTextNode = undefined;
        }
        var transformedParagraph = new nodes_1.DocParagraph({});
        transformedParagraph.appendNodes(transformedNodes);
        return transformedParagraph;
    };
    TrimSpacesTransform._canMergeExcerpts = function (currentExcerpt, followingExcerpt) {
        if (currentExcerpt === undefined || followingExcerpt === undefined) {
            return true;
        }
        if (!currentExcerpt.spacingAfterContent.isEmpty()
            || !followingExcerpt.spacingAfterContent.isEmpty()) {
            return false;
        }
        var currentSequence = currentExcerpt.content;
        var followingSequence = followingExcerpt.content;
        if (currentSequence.parserContext !== followingSequence.parserContext) {
            return false;
        }
        return currentSequence.endIndex === followingSequence.startIndex;
    };
    TrimSpacesTransform._mergeExcerpts = function (currentExcerpt, followingExcerpt) {
        if (currentExcerpt === undefined) {
            return followingExcerpt;
        }
        if (followingExcerpt === undefined) {
            return currentExcerpt;
        }
        if (!currentExcerpt.spacingAfterContent.isEmpty()
            || !followingExcerpt.spacingAfterContent.isEmpty()) {
            // This would be a program bug
            throw new Error('mergeExcerpts(): Cannot merge excerpts with spacingAfterContent');
        }
        var currentSequence = currentExcerpt.content;
        var followingSequence = followingExcerpt.content;
        if (currentSequence.parserContext !== followingSequence.parserContext) {
            // This would be a program bug
            throw new Error('mergeExcerpts(): Cannot merge excerpts with incompatible parser contexts');
        }
        if (currentSequence.endIndex !== followingSequence.startIndex) {
            // This would be a program bug
            throw new Error('mergeExcerpts(): Cannot merge excerpts that are not adjacent');
        }
        return new Excerpt_1.Excerpt({
            content: currentSequence.getNewSequence(currentSequence.startIndex, followingSequence.endIndex)
        });
    };
    return TrimSpacesTransform;
}());
exports.TrimSpacesTransform = TrimSpacesTransform;
//# sourceMappingURL=TrimSpacesTransform.js.map

/***/ }),

/***/ "./node_modules/css-loader/index.js!./src/index.css":
/*!*************************************************!*\
  !*** ./node_modules/css-loader!./src/index.css ***!
  \*************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "body {\r\n  margin: '5px';\r\n  padding: 0;\r\n  font-family: sans-serif;\r\n}\r\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/css-loader/lib/css-base.js":
/*!*************************************************!*\
  !*** ./node_modules/css-loader/lib/css-base.js ***!
  \*************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),

/***/ "./node_modules/style-loader/lib/addStyles.js":
/*!****************************************************!*\
  !*** ./node_modules/style-loader/lib/addStyles.js ***!
  \****************************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getTarget = function (target, parent) {
  if (parent){
    return parent.querySelector(target);
  }
  return document.querySelector(target);
};

var getElement = (function (fn) {
	var memo = {};

	return function(target, parent) {
                // If passing function in options, then use it for resolve "head" element.
                // Useful for Shadow Root style i.e
                // {
                //   insertInto: function () { return document.querySelector("#foo").shadowRoot }
                // }
                if (typeof target === 'function') {
                        return target();
                }
                if (typeof memo[target] === "undefined") {
			var styleTarget = getTarget.call(this, target, parent);
			// Special case to return head of iframe instead of iframe itself
			if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
				try {
					// This will throw an exception if access to iframe is blocked
					// due to cross-origin restrictions
					styleTarget = styleTarget.contentDocument.head;
				} catch(e) {
					styleTarget = null;
				}
			}
			memo[target] = styleTarget;
		}
		return memo[target]
	};
})();

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(/*! ./urls */ "./node_modules/style-loader/lib/urls.js");

module.exports = function(list, options) {
	if (true) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton && typeof options.singleton !== "boolean") options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
        if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else if (typeof options.insertAt === "object" && options.insertAt.before) {
		var nextSibling = getElement(options.insertAt.before, target);
		target.insertBefore(style, nextSibling);
	} else {
		throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	if(options.attrs.type === undefined) {
		options.attrs.type = "text/css";
	}

	if(options.attrs.nonce === undefined) {
		var nonce = getNonce();
		if (nonce) {
			options.attrs.nonce = nonce;
		}
	}

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	if(options.attrs.type === undefined) {
		options.attrs.type = "text/css";
	}
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function getNonce() {
	if (false) {}

	return __webpack_require__.nc;
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),

/***/ "./node_modules/style-loader/lib/urls.js":
/*!***********************************************!*\
  !*** ./node_modules/style-loader/lib/urls.js ***!
  \***********************************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),

/***/ "./src/index.css":
/*!***********************!*\
  !*** ./src/index.css ***!
  \***********************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(/*! !../node_modules/css-loader!./index.css */ "./node_modules/css-loader/index.js!./src/index.css");

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(/*! ../node_modules/style-loader/lib/addStyles.js */ "./node_modules/style-loader/lib/addStyles.js")(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),

/***/ "./src/index.tsx":
/*!***********************************!*\
  !*** ./src/index.tsx + 3 modules ***!
  \***********************************/
/*! no exports provided */
/*! ModuleConcatenation bailout: Cannot concat with ../tsdoc/lib/index.js (<- Module is not an ECMAScript module) */
/*! ModuleConcatenation bailout: Cannot concat with external "React" (<- Module is not an ECMAScript module) */
/*! ModuleConcatenation bailout: Cannot concat with external "ReactDOM" (<- Module is not an ECMAScript module) */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: external "React"
var external_React_ = __webpack_require__("react");

// EXTERNAL MODULE: external "ReactDOM"
var external_ReactDOM_ = __webpack_require__("react-dom");

// CONCATENATED MODULE: ./node_modules/tslib/tslib.es6.js
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
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

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __exportStar(m, exports) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
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

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

// EXTERNAL MODULE: ../tsdoc/lib/index.js
var lib = __webpack_require__("../tsdoc/lib/index.js");

// CONCATENATED MODULE: ./src/PlaygroundView.tsx



var PlaygroundView_PlaygroundView = /** @class */ (function (_super) {
    __extends(PlaygroundView, _super);
    function PlaygroundView(props, context) {
        var _this = _super.call(this, props, context) || this;
        _this._reparseTimerHandle = undefined;
        _this._reparseNeeded = true;
        _this.state = {
            inputText: [
                '/**',
                ' * Returns the average of two numbers.',
                ' *',
                ' * @remarks',
                ' * This method is part of the {@link core-library#Statistics | Statistics subsystem}.',
                ' *',
                ' * @param x - The first input number',
                ' * @param y - The second input number',
                ' * @returns The arithmetic mean of `x` and `y`',
                ' *',
                ' * @beta',
                ' */'
            ].join('\n'),
            outputText: '',
            errorsText: ''
        };
        return _this;
    }
    PlaygroundView.prototype.componentDidMount = function () {
        this._reparseTimerHandle = setInterval(this._reparseTimer_onTick.bind(this), 700);
    };
    PlaygroundView.prototype.componentWillUnmount = function () {
        if (this._reparseTimerHandle !== undefined) {
            clearInterval(this._reparseTimerHandle);
            this._reparseTimerHandle = undefined;
        }
    };
    PlaygroundView.prototype.render = function () {
        var textAreaStyle = {
            width: '600px',
            height: '400px'
        };
        var errorsTextAreaStyle = {
            width: '1200px',
            height: '200px'
        };
        return (external_React_["createElement"]("div", null,
            external_React_["createElement"]("textarea", { id: 'input-textarea', style: textAreaStyle, value: this.state.inputText, onChange: this._inputTextArea_onChange.bind(this) }),
            external_React_["createElement"]("textarea", { id: 'output-textarea', readOnly: true, value: this.state.outputText, style: textAreaStyle }),
            external_React_["createElement"]("br", null),
            "Errors:",
            external_React_["createElement"]("br", null),
            external_React_["createElement"]("textarea", { id: 'errors-textarea', readOnly: true, value: this.state.errorsText, style: errorsTextAreaStyle })));
    };
    PlaygroundView.prototype._inputTextArea_onChange = function (event) {
        this.setState({
            inputText: event.target.value
        });
        this._reparseNeeded = true;
    };
    PlaygroundView.prototype._reparseTimer_onTick = function () {
        if (!this._reparseNeeded) {
            return;
        }
        this._reparseNeeded = false;
        try {
            var inputText = this.state.inputText;
            var tsdocParser = new lib["TSDocParser"]();
            var parserContext = tsdocParser.parseString(inputText);
            var errorsText = parserContext.log.messages.map(function (x) { return x.toString(); }).join('\n');
            var outputLines = [];
            if (parserContext.docComment) {
                this._dumpTSDocTree(outputLines, parserContext.docComment);
            }
            this.setState({
                outputText: outputLines.join('\n'),
                errorsText: errorsText
            });
        }
        catch (error) {
            this.setState({
                outputText: '',
                errorsText: 'Unhandled exception: ' + error.message
            });
        }
    };
    PlaygroundView.prototype._dumpTSDocTree = function (outputLines, docNode, indent) {
        if (indent === void 0) { indent = ''; }
        var dumpText = indent + "- " + docNode.kind;
        if (docNode instanceof lib["DocNodeLeaf"] && docNode.excerpt) {
            var content = docNode.excerpt.content.toString();
            if (content.length > 0) {
                dumpText += ': ' + JSON.stringify(content);
            }
        }
        outputLines.push(dumpText);
        for (var _i = 0, _a = docNode.getChildNodes(); _i < _a.length; _i++) {
            var child = _a[_i];
            this._dumpTSDocTree(outputLines, child, indent + '  ');
        }
    };
    return PlaygroundView;
}(external_React_["Component"]));


// CONCATENATED MODULE: ./src/App.tsx



var App_App = /** @class */ (function (_super) {
    __extends(App, _super);
    function App() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    App.prototype.render = function () {
        return (external_React_["createElement"]("div", null,
            external_React_["createElement"]("h1", null, "TSDoc Playground"),
            external_React_["createElement"](PlaygroundView_PlaygroundView, null)));
    };
    return App;
}(external_React_["Component"]));
/* harmony default export */ var src_App = (App_App);

// EXTERNAL MODULE: ./src/index.css
var src = __webpack_require__("./src/index.css");

// CONCATENATED MODULE: ./src/index.tsx




external_ReactDOM_["render"](external_React_["createElement"](src_App, null), document.getElementById('root'));


/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports) {

(function() { module.exports = this["React"]; }());

/***/ }),

/***/ "react-dom":
/*!***************************!*\
  !*** external "ReactDOM" ***!
  \***************************/
/*! no static exports found */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports) {

(function() { module.exports = this["ReactDOM"]; }());

/***/ })

/******/ })));
//# sourceMappingURL=tsdoc-playground.js.map