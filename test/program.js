require.memoize("test",["lib/utils"],function(a,b,c){var d=a("lib/utils");b.boot=function(){d.echo()}}),require.memoize("lib/utils",[],function(a,b,c){b.echo=function(){console.log("Echo!")}})
