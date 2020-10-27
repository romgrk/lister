" !::exe [So]

command! Lister      call <SID>lister()
command! ListerStart call <SID>server_start()
command! ListerStop  call <SID>server_stop()


let s:dirname = expand('<sfile>:p:h:h')
let s:executable = s:dirname . "/bin/lister"

let s:job = v:null
let s:shadow_winid = v:null
let s:empty_bufnr = nvim_create_buf(0, 1)

let s:start_server = v:true

let g:lister = get(g:, 'lister', {})

function! s:setup()
  call s:server_stop()
  if !s:start_server
    return
  end
  call s:server_start()
endfunc

function! s:lister()
  let hl = nvim_get_hl_by_name('Normal', 1)
  let fg = '#' . printf("%x", get(hl, 'foreground', 0x303030))
  let bg = '#' . printf("%x", get(hl, 'background', 0xefefef))
  let cmd =  s:executable . " --input data/files.json "
    \ . " --fg '" . fg . "'"
    \ . " --bg '" . bg . "'"
  " echom cmd
  let s:job = s:run(cmd, getcwd(), function('s:lister_sink'))
  call s:shadow_open()
endfunc
function! s:lister_sink(opts) dict
  call s:shadow_close()
  let stderr = join(a:opts.stderr, '')
  let stdout = join(a:opts.stdout, '')
  if !empty(stderr)
    echohl ErrorMsg
    echom stderr
    echohl None
    return
  end
  try
    let output = json_decode(stdout)
    " echom output
    if output.ok
      execute 'edit' output.item.text
    end
  catch '*'
    echohl ErrorMsg
    echom stderr
    echom stdout
    echohl None
  endtry
endfunc

function! s:server_start()
  let g:lister.server = s:run(
        \ "node src/index.js",
        \ s:dirname,
        \ function('s:server_stopped'))
  silent echom 'lister: server started'
endfunc
function! s:server_stop()
  if has_key(g:lister, 'server')
    echom 'lister: server stopping'
    let job = g:lister.server
    let id = job.id
    let job.handler = v:null
    call remove(g:lister, 'server')
    call jobstop(id)
  end
endfunc
function! s:server_stopped(job)
  if !a:job.stopped && v:exiting == v:null
    let stderr = join(a:job.stderr, '')
    let stdout = join(a:job.stdout, '')
    echohl ErrorMsg
    echom "lister: server stopped:\n"
    echom stdout
    echom stderr
    echohl None
  end
  call remove(g:lister, 'server')
endfunc

" runs a command then calls Fn handler
function! s:run(cmd, cwd, Fn)
  let opts = {}
  let opts.cmd = a:cmd
  let opts.cwd = fnamemodify(expand(a:cwd), ':p')
  let opts.stdout = []
  let opts.stderr = []
  let opts.on_stdout = function('s:on_stdout')
  let opts.on_stderr = function('s:on_stderr')
  let opts.on_exit = function('s:on_exit')
  let opts.handler = a:Fn
  let opts.stopped = v:false
  let opts.id = jobstart(a:cmd, opts)
  return opts
endfunction
function! s:on_stdout(id, data, event) dict
  call extend(self.stdout, a:data)
endfunction
function! s:on_stderr(id, data, event) dict
  call extend(self.stderr, a:data)
endfunction
function! s:on_exit(...) dict
  let self.stdout = filter(self.stdout, "v:val != ''")
  let self.stderr = filter(self.stderr, "v:val != ''")
  if has_key(self, 'handler') && type(self.handler) == v:t_func
    call self.handler(self)
  end
endfunction

" open/close shadow window
function! s:shadow_open()
   let opts =  {
   \ 'relative': 'editor',
   \ 'style': 'minimal',
   \ 'width': &columns,
   \ 'height': &lines - 2,
   \ 'row': 2,
   \ 'col': 0,
   \ }
   let s:shadow_winid = nvim_open_win(s:empty_bufnr, v:false, opts)
   call setwinvar(s:shadow_winid, '&winhighlight', 'Normal:BufferShadow,NormalNC:BufferShadow,EndOfBuffer:BufferShadow')
   call setwinvar(s:shadow_winid, '&winblend', 100)
   call timer_start(50, {->
    \ setwinvar(s:shadow_winid, '&winblend',
    \   getwinvar(s:shadow_winid, '&winblend') - 5)}, { 'repeat': 5 })
endfunc
function! s:shadow_close()
   if s:shadow_winid != v:null && nvim_win_is_valid(s:shadow_winid)
      call nvim_win_close(s:shadow_winid, v:true)
   end
   let s:shadow_winid = v:null
endfunc

call s:setup()
let lister.server_start = function('s:server_start')
let lister.server_stop = function('s:server_stop')
