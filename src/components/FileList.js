import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from '../hooks/useContextMenu'
import { getParentNode } from '../utils/helper'

const { remote } = window.require('electron')

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
  const [ editStatus, setEditStatus ] = useState(false)
  const [ value, setValue ] = useState('')
  let node = useRef(null)
  const enterPressed = useKeyPress(13)
  const escPressed = useKeyPress(27)

  const closeSearch = (editItem) => {
    setEditStatus(false)
    setValue('')
    // editItem isNew时
    if (editItem.isNew) {
      onFileDelete(editItem.id)
    }
  }
  // 菜单
  const clickedItem = useContextMenu([
    {
      label: '打开',
      click: () => {
        // console.log('clicking', clickedItem.current)
        const parentElement = getParentNode(clickedItem.current, 'file-item')
        if (parentElement) {
          onFileClick(parentElement.dataset.id)
        }
      }
    }, {
      label: '重命名',
      click: () => {
        // console.log('renaming')
        const parentElement = getParentNode(clickedItem.current, 'file-item')
        if (parentElement) {
          const { id, title } = parentElement.dataset
          setEditStatus(id)
          setValue(title)
        }
      }
    }, {
      label: '删除',
      click: () => {
        // console.log('deleting')
        const parentElement = getParentNode(clickedItem.current, 'file-item')
        if (parentElement) {
          onFileDelete(parentElement.dataset.id)
        }
      }
    }
  ], '.file-list', [files])
  // 绑定键盘事件
  useEffect(() => {
    const editItem = files.find(file => file.id === editStatus)
    if (enterPressed && editStatus && value.trim() !== '') {
      onSaveEdit(editItem.id, value, editItem.isNew)
      setEditStatus(false)
      setValue('')
    }
    if (escPressed && editStatus) {
      closeSearch(editItem)
    }
  })
  
  useEffect(() => {
    const newFile = files.find(file => file.isNew)
    if (newFile) {
      setEditStatus(newFile.id)
      setValue(newFile.title)
    }
  }, [files])

  useEffect(() => {
    if(editStatus) {
      node.current.focus()
    }
  }, [editStatus])

  return (
    <ul className="list-group list-group-flush file-list">
      {
        files.map(file => (
          <li className="list-group-item bg-light row d-flex align-items-center file-item mx-0" key={file.id} data-id={file.id} data-title={file.title}>
            { 
              ((file.id !== editStatus) && !file.isNew) &&
              <>
                <span className="col-2"><FontAwesomeIcon icon={faMarkdown} size="lg" /></span>
                <span className="col-6 c-link" onClick={() => onFileClick(file.id)}>{file.title}</span>
                <button type="button" className="icon-button col-2" onClick={() => { setEditStatus(file.id); setValue(file.title)}}><FontAwesomeIcon icon={faEdit} title="编辑" size="lg" /></button>
                <button type="button" className="icon-button col-2" onClick={() => onFileDelete(file.id)}><FontAwesomeIcon icon={faTrash} title="删除" size="lg" /></button>
              </>
            }
            {
              ((file.id === editStatus) || file.isNew) &&
              <>
                <input type="text" ref={node} className="form-control col-10" value={value} placeholder="请输入文件名称" onChange={(e) => { setValue(e.target.value) }} />
                <button type="button" className="icon-button col-2" onClick={() => { closeSearch(file) }}><FontAwesomeIcon icon={faTimes} title="关闭" size="lg" /></button>
              </>
            }
          </li>
        ))
      }
    </ul>
  )
}

// 属性检查
FileList.propTypes = {
  files: PropTypes.array,
  onFileClick: PropTypes.func,
  onFileDelete: PropTypes.func,
  onSaveEdit: PropTypes.func,
}
// // 默认属性
// FileSearch.defaultProps = {
//   title: '我的云文档'
// }
export default FileList