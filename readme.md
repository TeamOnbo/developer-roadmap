#How to parse modules from roadmap repo:

* Go to `parser` branch
* Go to `parser.js` file in root directory. Change the variable `97cc7f9a-b562-4124-b04e-a4dc5db8bed8` according to organization org_department_id for engineering
* Just run `node ./parser.js {roadmapName}` 
* e.g. `node parser.js frontend`
* It will create all modules with tasks and resources in `{roadmapName-modules.json} file`
* Minify the json before passing it in our panel. Use [https://codebeautify.org/jsonminifier](https://codebeautify.org/jsonminifier)
* Copy this and paste in our internal admin panel along with other data

Note: The code is using the directory structure to get out module and task names, It would be better to run it on local then to deploy it as size of repo is too big