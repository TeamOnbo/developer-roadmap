import fs from 'fs'

const roadmapToFetch = process.argv[2]
const roadmapType = process.argv[3]

if(! roadmapToFetch){
    console.error("please provide a roadmap name to fetch modules for")
    process.exit(0)
}

if(! roadmapType){
    console.error("please provide the roadmap type e.g. Role based, Skill based, Best practice")
    process.exit(0)
}

if(! ["Role based", "Skill based", "Best practice"].includes(roadmapType)){
    console.error("Invalid value for rroadmap type. accepted value ->Role based, Skill based, Best practice")
    process.exit(0)
}

const getLinksFromMdFileWithName = (content) => {
    let regex = /(?=\[(!\[.+?\]\(.+?\)|.+?)]\((https:\/\/[^\)]+)\))/gi
    
    let links = [...content.matchAll(regex)].map((m) => ({ text: m[1], link: m[2] }))
    
    return links
}

const cleanFileName = (dirtyName) => {
    const cleanName = dirtyName.split('-').splice(1).join(' ')
    if(cleanName.includes('md')){
        return cleanName.replace('.md','')
    }
    return cleanName
}

const getFilesInsideTwoLevelDeepDirectory = (source) => {
    const modules = {}
    
    const files = fs.readdirSync(source, {withFileTypes: true})
    files.forEach(file => {
        if(file.isDirectory()){
            if(file.name.includes('.md')) return
            const fileName = cleanFileName(file.name) 
            modules[fileName] = {}
            
            const subFileSource = source + '/' + file.name
            const subFiles = fs.readdirSync(subFileSource, {withFileTypes: true})

            subFiles.forEach((subFile) => {
                
                if(subFile.name && subFile.name.includes('.md')){
                    const fileMdContent = fs.readFileSync(subFileSource + '/' + subFile.name,'utf-8')
                    let resources = getLinksFromMdFileWithName(fileMdContent)
                    if(cleanFileName(subFile.name) == ""){
                        modules[fileName].resources = resources
                        return 
                    }  
                    if(modules[fileName].tasks){
                        modules[fileName].tasks.push({name: cleanFileName(subFile.name), resources})
                    }else{
                        modules[fileName].tasks = [{name: cleanFileName(subFile.name), resources}]
                    }
                }
            })
        }
    });

    return modules
}
let source = `src/data/roadmaps/${roadmapToFetch}/content`

const raw_modules = getFilesInsideTwoLevelDeepDirectory(source)

const generateLinkTypeResourcesFromLinkAndName = (link, name) => {
    return {
        url: link,
        type: 'Link',
        extra_data: {
            file_name: name
        }
    }
}

const generateLinkTypeResourcesFromRawLinks = (raw_links) => {
    return raw_links.map((raw_link) => generateLinkTypeResourcesFromLinkAndName(raw_link.link, raw_link.text))
}

const generateTasksAndResourcesFromRawTasks = (raw_tasks) => {
    return raw_tasks.map((task) => ({
        name: task.name,
        is_active: true,
        attachments: generateLinkTypeResourcesFromRawLinks(task.resources)
    }))
}

const capitalizeName = (str) => {
    const arr = str.split(" ");
    return arr.reduce((prev,curr,index)=>prev+ (index === 0 ? "": " " )+ (curr.charAt(0).toUpperCase() + curr.slice(1)),"")
}

const generateModulesFromRawData = (raw_modules, org_department_id, roadmapName, type) => {
    const parsedModules = []
    Object.keys(raw_modules).forEach((raw_module) => {
        const module = {
            name: capitalizeName(raw_module),
            org_department_id,
            category: "Department Mandatory",
            description: "" ,
            priority: "Medium",
            tags: [type ,roadmapName],
            is_validation_required: false,
            is_active: true,
            tasks: [],
            reviewers: [],
            attachments: []
        }

        if(raw_modules[raw_module].resources && Array.isArray(raw_modules[raw_module].resources) && raw_modules[raw_module].resources.length > 0){
            module.attachments = generateLinkTypeResourcesFromRawLinks(raw_modules[raw_module].resources)
        }

        if(raw_modules[raw_module].tasks && Array.isArray(raw_modules[raw_module].tasks) && raw_modules[raw_module].tasks.length > 0){
            module.tasks = generateTasksAndResourcesFromRawTasks(raw_modules[raw_module].tasks)
        }
        
        parsedModules.push(module)
    })

    return parsedModules
}

let engineering_department_id = "4bda750d-530a-43b9-bbd7-dd6a8d9e4dc2"

try{
    const modules = generateModulesFromRawData(raw_modules,engineering_department_id,roadmapToFetch, roadmapType)

    fs.writeFileSync(`${roadmapToFetch}-modules.json`, JSON.stringify(modules))
}catch(err){
    console.error(err)
    process.exit(0)
}
