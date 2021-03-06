enyo.kind({
	name: "analyzer.Walker",
	kind: enyo.Component,
	published: {
		verbose: false
	},
	events: {
		onProgress: "",
		onFinish: ""
	},
	walk: function(inPath, inPathResolver) {
		if (this.verbose) {
			this.log("inPath: " + inPath + " resolver: ", inPathResolver);
		}
		// make a new loader
		this.loader = new enyo.loaderFactory(analyzer.runtimeMachine, inPathResolver);
		// stub out script loader, we only need manifests to walk dependencies
		this.loader.loadScript = function(){};
		// stub out stylesheet loader
		this.loader.loadSheet = function(){};
		// control logging
		this.loader.verbose = this.verbose;
		// callbacks
		this.loader.report = this.bindSafely("walkReport");
		this.loader.finish = this.bindSafely("walkFinish");

		/*
			TERRIBLE HACK: substitute for default loader
			--------------------------------------------
			If we don't do this the analysis silently fails as "enyo.depends"
			directly refers to "enyo.loader".

			Not SURE of the impacts especially if the enyo.loader is invoked
			to load some more application files while the analysis is ongoing.

			Not SURE either how loading will behave *after* analysis is done: enyo.loader
			is not restored...
		 */
		enyo.loader = this.loader;

		// walk application dependencies
		var path;
		if (inPathResolver) {
			path = inPathResolver.rewrite(inPath);
			if (this.verbose && path !== inPath) {
				this.log("inPathResolver: " + inPath + " ==> " + path);
			}
		} else {
			path = enyo.path.rewrite(inPath);
			if (this.verbose && path !== inPath) {
				this.log("enyo.path: " + inPath + " ==> " + path);
			}
		}
		enyo.asyncMethod(this.loader, "load", path);
		this.async = new enyo.Async();
		return this.async;
	},
	walkReport: function(inAction, inName) {
		this.doProgress({action: inAction, name: inName});
	},
	walkFinish: function() {
		// we've read all the manifests and constructed our list of modules
		this.modules = this.loader.modules;
		this.designs = this.loader.designs;
		this.async.respond({modules: this.modules, designs: this.designs});
		this.doFinish({modules: this.modules, designs: this.designs});
	}
});
