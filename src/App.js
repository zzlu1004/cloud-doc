import { useState } from 'react'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
// import defaultFiles from './utils/defaultFiles'
import BottomBtn from './components/BottomBtn'
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import TabList from './components/TabList'
import SimpleMDE from "react-simplemde-editor"
import { v4 as uuidv4 } from 'uuid'
import { flattenArr, objToArr } from './utils/helper'
import "easymde/dist/easymde.min.css"
import fileHelper from './utils/fileHelper'
import useIpcRenderer from './hooks/useIpcRenderer'

const { join, basename, extname, dirname } = window.require('path')
const { remote } = window.require('electron')
const Store = window.require('electron-store')
const fileStore = new Store({'name': 'Files Data'})
const settingsStore = new Store({name: 'Settings'})
// store.set('name', 'zzlu')
// console.log(store.get('name'))
const saveFilesToStore = (files) => {
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt } = file
    result[id] = {
      id,
      path,
      title,
      createdAt
    }
    return result
  }, {})
  fileStore.set('files', filesStoreObj)
}

function App() {
  const [ files, setFiles ] = useState(fileStore.get('files') || {})
  const [ searchedFiles, setSearchedFiles ] = useState([])
  const [ activeFileID, setActiveFileID ] = useState('')
  const [ openedFileIDs, setOpenedFileIDs ] = useState([])
  const [ unsavedFileIDs, setUnsavedFileIDs ] = useState([])
  // const [ isClickChange, setIsClickChange ] = useState(false)
  const filesArr = objToArr(files)
  const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents')
  const openFiles = openedFileIDs.map(openID => {
    return files[openID]
  })
  const activeFile = files[activeFileID]
  const fileListArr = searchedFiles.length > 0 ? searchedFiles : filesArr

  // 左侧文件列表点击事件
  const fileClick = fileID => {
    setActiveFileID(fileID)
    // setIsClickChange(true)
    const currentFile = files[fileID]
    if (!currentFile.isLoaded) {
      fileHelper.readFile(currentFile.path).then(value => {
        const newFile = { ...files[fileID], body: value, isLoaded: true }
        setFiles({ ...files, [fileID]: newFile })
        // setIsClickChange(false)
      })
    }

    if (!openedFileIDs.includes(fileID)) {
      setOpenedFileIDs([ ...openedFileIDs, fileID ])
    }
  }
  // 右侧标题点击事件
  const tabClick = fileID => {
    setActiveFileID(fileID)
  }
  // 右侧标题关闭事件
  const tabClose = fileID => {
    const tabsWithout = openedFileIDs.filter(id => fileID !== id)
    setOpenedFileIDs(tabsWithout)
    // 设置高亮
    if (tabsWithout.length) {
      setActiveFileID(tabsWithout[0])
    } else {
      setActiveFileID('')
    }
  }
  // markdown编辑器输入回调
  const fileChange = (id, value) => {
    if (value !== files[id].body) {
      const newFile = { ...files[id], body: value }
      setFiles({ ...files, [id]: newFile })
      if (!unsavedFileIDs.includes(id)) {
        console.log('fileChange', id)
        setUnsavedFileIDs([ ...unsavedFileIDs, id])
      }
    }
  }
  // 删除文件
  const deleteFile = id => {
    if (files[id].isNew) {
      // delete files[id]
      // setFiles({ ...files })
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)
    } else {
      fileHelper.deleteFile(files[id].path).then(() => {
        const { [id]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        // 关闭右侧已打开文件 
        tabClose(id)
      })
    }
  }
  // 保存文件名修改
  const updateFileName = (id, title, isNew) => {
    const newPath = isNew ? join(savedLocation, `${title}.md`) : join(dirname(files[id].path), `${title}.md`)
    const modifiedFile = { ...files[id], title, isNew: false, path: newPath }
    const newFiles = { ...files, [id]: modifiedFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      const oldPath = files[id].path
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }

  // 搜索
  const fileSearch = keyword => {
    const newFiles = filesArr.filter(file => file.title.includes(keyword))
    setSearchedFiles(newFiles)
  }

  // 新建文件
  const createNewFile = () => {
    const newID = uuidv4()
    const newFile = {
      id: newID,
      title: '',
      body: '## 请输入 Markdown',
      createdAt: new Date().getTime(),
      isNew: true
    }
    
    setFiles({ ...files, [newID]: newFile })
  }

  // 保存
  const saveCurrentFile = () => {
    fileHelper.writeFile(activeFile.path, activeFile.body).then(() => {
      setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id))
    })
  }

  // 导入
  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title: '选择导入的 Markdown 文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {name: 'Markdown files', extensions: ['md']}
      ]
    }).then(result => {
      // console.log(result.canceled)
      // console.log(result.filePaths)
      const paths = result.filePaths
      if(Array.isArray(paths)) {
        const filteredPaths = paths.filter(path => {
          const alreadyAdded = Object.values(files).find(file => {
            return file.path === path
          })
          return !alreadyAdded
        })
        const importFilesArr = filteredPaths.map(path => {
          return {
            id: uuidv4(),
            title: basename(path, extname(path)),
            path
          }
        })
        const newFiles = { ...files, ...flattenArr(importFilesArr) }
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if (importFilesArr.length > 0) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: `成功导入了${importFilesArr.length}个文件`,
            message: `成功导入了${importFilesArr.length}个文件`
          })
        }
      } else {

      }
    }).catch(err => {
      console.log(err)
    })
  }

  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile
  })
  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <div className="col-3 bg-light left-panel">
          <FileSearch onFileSearch={fileSearch} />
          <FileList
            files={fileListArr} 
            onFileClick={fileClick}
            onFileDelete={deleteFile}
            onSaveEdit={updateFileName}
          />
          <div className="row no-gutters button-group">
            <div className="col">
              <BottomBtn text="新建" onBtnClick={createNewFile} colorClass="btn-primary" icon={faPlus} />
            </div>
            <div className="col">
              <BottomBtn text="导入" onBtnClick={importFiles} colorClass="btn-success" icon={faFileImport} />
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          {
            !activeFile && 
            <div className="start-page">
              选择或者创建新的 Markdown 文档
            </div>
          }
          { activeFile && 
            <>
              <TabList
                files={openFiles}
                activeId={activeFileID}
                unSaveIds={unsavedFileIDs}
                onTabClick={tabClick}
                onCloseTab={tabClose}
              />
              <SimpleMDE
                key={activeFile && activeFile.id}
                value={activeFile && activeFile.body} 
                onChange={value => { fileChange(activeFile.id, value) }}
                options = {{
                  minHeight: '515px'
                }}
              />
              {/* <BottomBtn text="保存" onBtnClick={saveCurrentFile} colorClass="btn-success" icon={faSave} /> */}
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
